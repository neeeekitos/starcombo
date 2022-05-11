import {
  DexCombo,
  findPoolRes,
  StarknetConnector, SwapParameters, TradeInfo
} from "../utils/constants/interfaces";
import {Call, Provider} from "starknet";
import {
  Action, ActionTypes,
  JEDI_REGISTRY_ADDRESS, JEDI_REGISTRY_ADDRESS_2,
  JEDI_ROUTER_ADDRESS,
  ProtocolNames,
  SLIPPAGE
} from "../utils/constants/constants";
import {BigNumber, ethers} from "ethers";
import {BigintIsh, ChainId, Fraction, JSBI, Pair, Percent, Price, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {number} from "starknet";
import {
  formatToBigNumberish,
  formatToDecimal,
  getBalanceOfErc20,
  getTotalSupplyOfErc20
} from "../utils/helpers";
import {bnToUint256} from "starknet/utils/uint256";
import {bigNumberishArrayToDecimalStringArray} from "starknet/utils/number";
import {jediLPMapping} from "./jediswap/constants/jediLPTokenList";

export interface PoolPosition {
  poolSupply: TokenAmount,
  userLiquidity: TokenAmount,
  poolPair: Pair,
}

export class JediSwap implements DexCombo {

  protected static instance: JediSwap;

  protected constructor() {
  }

  /**
   * Singleton pattern. If the instance exists returns it, otherwise creates a
   * new instance.
   */
  public static getInstance(): JediSwap {
    if (!JediSwap.instance) {
      JediSwap.instance = new JediSwap();
    }

    return JediSwap.instance;
  }


  /**
   * Returns the transaction details to perform a swap between two tokens
   * @param starknetConnector
   * @param swapParameters
   * @param poolId
   */
  public async swap(starknetConnector: StarknetConnector, swapParameters: SwapParameters): Promise<Action> {
    let {tokenFrom, tokenTo, amountIn, amountOut, poolPair} = swapParameters;
    //TODO handle when user specifies amountOut

    //DONT USE PARSE ETHER BECAUSE OUR TOKENS ARE NOT 18 DEC
    const amountInBN = formatToBigNumberish(amountIn, tokenFrom.decimals)
    const amountOutBN = formatToBigNumberish(amountOut, tokenTo.decimals);

    const trade = await this.findBestTrade(tokenFrom, tokenTo, poolPair, amountInBN, amountOutBN, SLIPPAGE)
    if (!trade) return undefined;



    //flatten the array because and uint256 and trade.pathAddresses is a subarray
    const swapCallData =
      [
        Object.values(bnToUint256(amountInBN)),
        Object.values(bnToUint256(trade.amountOutMin)),
        trade.pathLength,
        trade.pathAddresses,
        number.toBN(starknetConnector.account.address),
        Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
      ].flatMap((x) => x);

    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: bigNumberishArrayToDecimalStringArray(
          [
            number.toBN(JEDI_ROUTER_ADDRESS).toString(), // router address decimal
            Object.values(bnToUint256(amountInBN)),
          ].flatMap((x) => x)
        )
      },
      {
        contractAddress: JEDI_ROUTER_ADDRESS,
        entrypoint: 'swap_exact_tokens_for_tokens',
        calldata: bigNumberishArrayToDecimalStringArray(swapCallData)
      }
    ];
    return Promise.resolve({
      actionType: ActionTypes.SWAP,
      protocolName: ProtocolNames.JEDISWAP,
      call: tx,
      details: trade
    });
  }


  /**
   * Adds liquidity to the liquidity pool associated to the pair.
   * @param starknetConnector
   * @param poolPair
   * @param slippage
   * @param tokenAmountFrom
   */
  public async addLiquidity(starknetConnector: StarknetConnector, poolPair: Pair, slippage: Percent, tokenAmountFrom: TokenAmount): Promise<Action> {

    //TODO check if it's ok if amtToken0 corresponds to pool token 1
    //TODO check if there's another way to add fixed amountToken1 ? This works only if amountTokenFrom refers to Token0.

    let tokenFrom, tokenTo, tokenFromIsToken0, tokenFromPrice: Price;
    tokenAmountFrom.token.address === poolPair.token0.address ?
      [tokenFrom, tokenTo, tokenFromPrice, tokenFromIsToken0] = [poolPair.token0, poolPair.token1, poolPair.token0Price, true] :
      [tokenFrom, tokenTo, tokenFromPrice, tokenFromIsToken0] = [poolPair.token1, poolPair.token0, poolPair.token1Price, false];

    const tokenFromDec = number.toBN(tokenFrom.address);
    const tokenToDec = number.toBN(tokenTo.address);

    let desiredAmountFrom: ethers.BigNumber, minAmountFrom: string, desiredAmountTo: Fraction, minAmountTo: string;

    // from
    desiredAmountFrom = ethers.BigNumber.from(tokenAmountFrom.raw.toString());
    minAmountFrom = desiredAmountFrom.sub(SLIPPAGE.multiply(desiredAmountFrom.toBigInt()).toFixed(0)).toString()

    // to
    desiredAmountTo = tokenFromPrice.raw.multiply(desiredAmountFrom.toString());
    minAmountTo = desiredAmountTo.subtract(SLIPPAGE.multiply(desiredAmountTo).toFixed(0)).toFixed(0)


    // Build tx details
    const callData: Array<string> =
      [
        tokenFromIsToken0 ? tokenFromDec : tokenToDec,
        tokenFromIsToken0 ? tokenToDec : tokenFromDec,
        tokenFromIsToken0 ? Object.values(bnToUint256(desiredAmountFrom.toString())) : Object.values(bnToUint256(desiredAmountTo.toFixed(0))),
        tokenFromIsToken0 ? Object.values(bnToUint256(desiredAmountTo.toFixed(0))) : Object.values(bnToUint256(desiredAmountFrom.toString())),
        tokenFromIsToken0 ? Object.values(bnToUint256(minAmountFrom)) : Object.values(bnToUint256(minAmountTo)),
        tokenFromIsToken0 ? Object.values(bnToUint256(minAmountTo)) : Object.values(bnToUint256(minAmountFrom)),
        number.toBN(starknetConnector.account.address),
        Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
      ].flatMap((x) => x);


    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: bigNumberishArrayToDecimalStringArray([
            number.toBN(JEDI_ROUTER_ADDRESS), // router address decimal
            Object.values(bnToUint256(desiredAmountFrom.toString()))
          ].flatMap((x) => x)
        )
      },
      {
        contractAddress: tokenTo.address,
        entrypoint: 'approve',
        calldata: bigNumberishArrayToDecimalStringArray([
            number.toBN(JEDI_ROUTER_ADDRESS), // router address decimal
            Object.values(bnToUint256(desiredAmountTo.toFixed(0))),
          ].flatMap((x) => x)
        )
      },
      {
        contractAddress: JEDI_ROUTER_ADDRESS,
        entrypoint: 'add_liquidity',
        calldata: bigNumberishArrayToDecimalStringArray(callData)
      }
    ];
    return Promise.resolve({
      actionType: ActionTypes.ADD_LIQUIDITY,
      protocolName: ProtocolNames.JEDISWAP,
      call: tx
    });
  }


  /**
   * Removes liquidity from the pool
   * @param starknetConnector
   * @param poolPosition poolPosition object - with total pooly liq, user's liq and pair.
   * @param liqToRemove amount of liquidity to remove.
   */
  public removeLiquidity(starknetConnector: StarknetConnector, poolPosition: PoolPosition, liqToRemove: TokenAmount): Promise<Action> {

    const poolPair: Pair = poolPosition.poolPair;
    let poolShare = liqToRemove.divide(poolPosition.poolSupply); // represents the %of the pool the user owns.
    //token0Amount is reserve0*poolShare
    let token0Amount = poolPair.reserve0.multiply(poolShare);
    let token1Amount = poolPair.reserve1.multiply(poolShare)
    //These values are not in WEI but in unit... so we need to find a way to give the wei value without rounding.
    //To do so we parse units the whole result with the token decimals.
    // Inside this, we're calculating tokenAmount(1-slippage). Note that this result is in unit and not wei terms so we need to parseUnit all of this :)
    let token0min = ethers.utils.parseUnits(token0Amount.subtract(token0Amount.multiply(SLIPPAGE)).toFixed(poolPair.token0.decimals), poolPair.token0.decimals);
    let token1min = ethers.utils.parseUnits(token1Amount.subtract(token1Amount.multiply(SLIPPAGE)).toFixed(poolPair.token1.decimals), poolPair.token1.decimals);

    const approvalCallData = [
      number.toBN(JEDI_ROUTER_ADDRESS), // router address decimal
      Object.values(bnToUint256(liqToRemove.raw.toString())),
    ].flatMap((x) => x)

    const removeLiqCallData = [
      number.toBN(poolPair.token0.address),
      number.toBN(poolPair.token1.address),
      Object.values(bnToUint256(liqToRemove.raw.toString())),
      Object.values(bnToUint256(token0min.toString())),
      Object.values(bnToUint256(token1min.toString())),
      number.toBN(starknetConnector.account.address),
      Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
    ].flatMap((x) => x);

    const approval: Call | Call[] = {
      contractAddress: poolPair.pairAddress,
      entrypoint: 'approve',
      calldata: bigNumberishArrayToDecimalStringArray(approvalCallData)
    }

    const remove_liq: Call | Call[] = {
      contractAddress: JEDI_ROUTER_ADDRESS,
      entrypoint: 'remove_liquidity',
      calldata: bigNumberishArrayToDecimalStringArray(removeLiqCallData)
    };

    return Promise.resolve({
      actionType: ActionTypes.REMOVE_LIQUIDITY,
      protocolName: ProtocolNames.JEDISWAP,
      call: [approval, remove_liq]
    });
  }


  approve(): void {
  }

  mint(): void {
  }

  revoke(): void {
  }

  /**
   * Given two tokens, finds the liquidity pool and returns the associated Pair.
   * @param provider
   * @param tokenFrom
   * @param tokenTo
   */
  public async getPoolDetails(tokenFrom: Token, tokenTo: Token, provider: Provider) {

    const liquidityPool = await this.findPool(provider, tokenFrom, tokenTo)
    if (!liquidityPool) return undefined;

    const poolToken0 = new TokenAmount(tokenFrom, liquidityPool.liqReservesTokenFrom);
    const poolToken1 = new TokenAmount(tokenTo, liquidityPool.liqReservesTokenTo);
    const poolPair = new Pair(poolToken0, poolToken1, liquidityPool.liqPoolAddress);

    return {poolPair: poolPair};
  }

  /**
   * Given two tokens and the pool pair, returns the pool supply, the user's liquidity and the pool pair.
   * @param starknetConnector
   * @param token0
   * @param token1
   * @param poolPair
   */
  public async getLiquidityPosition(starknetConnector: StarknetConnector, token0: Token, token1: Token, poolPair: Pair): Promise<PoolPosition> {

    const liqPoolToken = poolPair.liquidityToken;

    const userBalance = await getBalanceOfErc20(starknetConnector, liqPoolToken)
    const totalSupply = await getTotalSupplyOfErc20(starknetConnector, liqPoolToken)

    const supply = new TokenAmount(liqPoolToken, totalSupply.toString());
    const liquidity = new TokenAmount(liqPoolToken, userBalance.toString());

    return {
      poolSupply: supply,
      userLiquidity: liquidity,
      poolPair: poolPair,
    }
  }


  /**
   * Returns the execution price for a swap.
   * @param starknetConnector
   * @param swapParameters parameters of the swap to execute
   */
  public async getSwapExecutionPrice(starknetConnector: StarknetConnector, swapParameters: SwapParameters) {
    let {tokenFrom, tokenTo, amountIn, amountOut, poolPair} = swapParameters;
    //DONT USE PARSE ETHER BECAUSE OUR TOKENS ARE NOT 18 DEC
    const amountInBN = formatToBigNumberish(amountIn, tokenFrom.decimals)
    const amountOutBN = formatToBigNumberish(amountOut, tokenTo.decimals);

    const trade = await this.findBestTrade(tokenFrom, tokenTo, poolPair, amountInBN, amountOutBN, SLIPPAGE)
    return {
      execPrice: parseFloat(trade.executionPrice),
      amountMin: formatToDecimal(trade.amountOutMin, tokenTo.decimals)
    }
  }


  /**
   * Given two Tokens, finds the associated pool
   * and returns details about the liquidity pool (address, token0, reserves).
   * @param provider starknet provider
   * @param tokenFrom one pool token
   * @param tokenTo another token
   */
  private async findPool(provider: Provider, tokenFrom: Token, tokenTo: Token): Promise<findPoolRes | undefined> {


    //Convert addresses to BN
    const tokenFromDec = number.toBN(tokenFrom.address)
    const tokenToDec = number.toBN(tokenTo.address)

    //Check for hardcoded pool addresses. If they don't exist, query the network.
    let liquidityPoolForTokens = jediLPMapping()[tokenFrom.address] ? jediLPMapping()[tokenFrom.address][tokenTo.address] : undefined
    if (!liquidityPoolForTokens) {
      //TODO search in registry 2 if not found
      liquidityPoolForTokens = await provider.callContract({
        contractAddress: JEDI_REGISTRY_ADDRESS_2,
        entrypoint: "get_pair_for",
        calldata: [
          tokenFromDec.toString(),
          tokenToDec.toString(),
        ]
      }).then((res) => res.result[0])
    }

    //Return code if pool isn't found.
    if (liquidityPoolForTokens === '0x0') return undefined

    //Gets address of pool's token0
    const liqPoolToken0 = await provider.callContract({
      contractAddress: liquidityPoolForTokens,
      entrypoint: "token0",
    }).then((res) => number.toBN(res.result[0]).toString())
    if (!liqPoolToken0) return undefined

    // Gets reserves for the tokenA tokenB liq pool
    const liqReserves = await provider.callContract({
      contractAddress: liquidityPoolForTokens!,
      entrypoint: "get_reserves",
    }).then((res) => res.result);
    if (!liqPoolToken0) return undefined

    //Correctly map our function's tokenFrom argument to the pool's token0
    let liqReservesTokenFrom = liqPoolToken0 === tokenFromDec.toString() ? liqReserves[0] : liqReserves[2];
    let liqReservesTokenTo = liqPoolToken0 === tokenFromDec.toString() ? liqReserves[2] : liqReserves[0];

    return {
      liqPoolAddress: liquidityPoolForTokens,
      liqPoolToken0: liqPoolToken0,
      liqReservesTokenFrom: liqReservesTokenFrom,
      liqReservesTokenTo: liqReservesTokenTo
    }
  }

  /**
   *
   * @param from Token from
   * @param to Token To
   * @param pairFromTo Pair from/to
   * @param amountFrom amount tokenFrom to swap
   * @param amountTo amount tokenTo desired (always true for now0
   * @param slippageTolerance user-defined slippage tolerance
   * @private
   */
  private async findBestTrade(from: Token, to: Token, pairFromTo: Pair, amountFrom: string, amountTo: string, slippageTolerance: Percent): Promise<TradeInfo | undefined> {
    //Create poolPair to find the best trade for this poolPair. Use liq reserves as poolPair amounts
    let trade: Trade;
    if (amountTo === "0") {
      trade = Trade.bestTradeExactIn([pairFromTo], new TokenAmount(from, amountFrom), to)[0];
    } else {
      trade = Trade.bestTradeExactOut([pairFromTo], from, new TokenAmount(from, amountFrom))[0];
    }
    console.log("execution price: $" + trade.executionPrice.toSignificant(6));
    console.log("price impact: " + trade.priceImpact.toSignificant(6) + "%");

    //TODO dynamic slippage value here
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = number.toBN(amountOutMin.toString());

    const path = trade.route.path;
    const pathAddresses = path.map((token: Token) => number.toBN(token.address).toString());

    return {
      pathLength: path.length.toString(),
      pathAddresses: pathAddresses,
      executionPrice: trade.executionPrice.toSignificant(6),
      amountOutMin: amountOutMinDec.toString()
    }
  }
}
