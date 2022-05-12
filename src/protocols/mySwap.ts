import {DexCombo, StarknetConnector, SwapParameters, TradeInfo} from "../utils/constants/interfaces";
import {ethers} from "ethers";

import {Abi, Call, Contract, number} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {ChainId, Fraction, Pair, Percent, Price, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {Action, ActionTypes, MY_SWAP_ROUTER_ADDRESS, ProtocolNames, SLIPPAGE} from "../utils/constants/constants";
import {PoolPosition} from "./jediSwap";
import {formatToBigNumberish, formatToDecimal} from "../utils/helpers";
import {bnToUint256, uint256ToBN} from "starknet/utils/uint256";
import {bigNumberishArrayToDecimalStringArray} from "starknet/utils/number";
import {myswapLpMapping} from "./myswap/constants/myswapLPTokenList";

export class MySwap implements DexCombo {

  protected static instance: MySwap;

  protected constructor() {
  }

  public static getInstance(): MySwap {
    if (!MySwap.instance) {
      MySwap.instance = new MySwap();
    }

    return MySwap.instance;
  }

  public async swap(starknetConnector: StarknetConnector, swapParameters: SwapParameters): Promise<Action> {
    let {tokenFrom, tokenTo, amountIn, amountOut, poolPair, poolId} = swapParameters;
    const tokenFromDec = number.toBN(tokenFrom.address).toString();

    //DONT USE PARSE ETHER BECAUSE OUR TOKENS ARE NOT 18 DEC
    const amountInBN = formatToBigNumberish(amountIn, tokenFrom.decimals)
    const amountOutBN = formatToBigNumberish(amountOut, tokenTo.decimals);
    const trade = await this.findBestTrade(tokenFrom, tokenTo, poolPair, amountInBN, amountOutBN, SLIPPAGE)
    if (!trade) return undefined;


    const approveCallData = [
      number.toBN(MY_SWAP_ROUTER_ADDRESS).toString(), // router address decimal
      Object.values(bnToUint256(amountInBN))
    ].flatMap((x) => x);

    const swapCallData = [
      poolId,
      tokenFromDec,
      Object.values(bnToUint256(amountInBN)),
      Object.values(bnToUint256(trade.amountOutMin))
    ].flatMap((x) => x);


    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: bigNumberishArrayToDecimalStringArray(approveCallData)
      },
      {
        contractAddress: MY_SWAP_ROUTER_ADDRESS,
        entrypoint: "swap",
        calldata: bigNumberishArrayToDecimalStringArray(swapCallData)
      }
    ]


    return Promise.resolve({
      actionType: ActionTypes.SWAP,
      protocolName: ProtocolNames.MY_SWAP,
      call: tx,
      details: trade
    });

  }

  async addLiquidity(starknetConnector: StarknetConnector, poolPair: Pair, slippage: Percent, tokenAmountFrom: TokenAmount): Promise<Action> {

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


    const addLiqCallData: Array<string> =
      [
        tokenFromIsToken0 ? tokenFromDec.toString() : tokenToDec.toString(),
        tokenFromIsToken0 ? Object.values(bnToUint256(desiredAmountFrom.toString())) : Object.values(bnToUint256(desiredAmountTo.toFixed(0))),
        tokenFromIsToken0 ? Object.values(bnToUint256(minAmountFrom)) : Object.values(bnToUint256(minAmountTo)),
        tokenFromIsToken0 ? tokenToDec.toString() : tokenFromDec.toString(),
        tokenFromIsToken0 ? Object.values(bnToUint256(desiredAmountTo.toFixed(0))) : Object.values(bnToUint256(desiredAmountFrom.toString())),
        tokenFromIsToken0 ? Object.values(bnToUint256(minAmountTo)) : Object.values(bnToUint256(minAmountFrom)),
      ].flatMap((x) => x);


    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: bigNumberishArrayToDecimalStringArray([
            number.toBN(MY_SWAP_ROUTER_ADDRESS),// router address decimal
            Object.values(bnToUint256(desiredAmountFrom.toString()))
          ].flatMap((x) => x)
        )
      },
      {
        contractAddress: tokenTo.address,
        entrypoint: 'approve',
        calldata: bigNumberishArrayToDecimalStringArray([
            number.toBN(MY_SWAP_ROUTER_ADDRESS), // router address decimal
            Object.values(bnToUint256(desiredAmountTo.toFixed(0))),
          ].flatMap((x) => x)
        )
      },
      {
        contractAddress: MY_SWAP_ROUTER_ADDRESS,
        entrypoint: 'add_liquidity',
        calldata: bigNumberishArrayToDecimalStringArray(addLiqCallData)

      }
    ];
    console.log(tx)
    return Promise.resolve({
      actionType: ActionTypes.ADD_LIQUIDITY,
      protocolName: ProtocolNames.MY_SWAP,
      call: tx
    });
  }

  removeLiquidity(starknetConnector: StarknetConnector, poolPosition: PoolPosition, liqToRemove: TokenAmount): Promise<Action> {

    const poolPair = poolPosition.poolPair;
    let poolShare = liqToRemove.divide(poolPosition.poolSupply); // represents the %of the pool the user owns.
    //token0Amount is reserve0*poolShare
    let token0Amount = poolPair.reserve0.multiply(poolShare);
    let token1Amount = poolPair.reserve1.multiply(poolShare)
    //These values are not in WEI but in unit... so we need to find a way to give the wei value without rounding.
    //To do so we parse units the whole result with the token decimals.
    // Inside this, we're calculating tokenAmount(1-slippage). Note that this result is in unit and not wei terms so we need to parseUnit all of this :)
    let token0min = ethers.utils.parseUnits(token0Amount.subtract(token0Amount.multiply(SLIPPAGE)).toFixed(poolPair.token0.decimals), poolPair.token0.decimals);
    let token1min = ethers.utils.parseUnits(token1Amount.subtract(token1Amount.multiply(SLIPPAGE)).toFixed(poolPair.token1.decimals), poolPair.token1.decimals);

    const removeLiqCallData = [
      poolPosition.poolPair.pairAddress, //no need for BN ops here because it's just the poolId
      Object.values(bnToUint256(liqToRemove.raw.toString())),
      Object.values(bnToUint256(token0min.toString())),
      Object.values(bnToUint256(token1min.toString())),
    ].flatMap(x => x);


    const tx: Call | Call[] = {
      contractAddress: MY_SWAP_ROUTER_ADDRESS,
      entrypoint: "withdraw_liquidity",
      calldata: bigNumberishArrayToDecimalStringArray(removeLiqCallData)
    };


    return Promise.resolve({
      actionType: ActionTypes.REMOVE_LIQUIDITY,
      protocolName: ProtocolNames.MY_SWAP,
      call: tx
    });
  }

  revoke(): void {
  }

  approve(): void {
  }

  mint(): void {
  }

  /**
   * Given two tokens, finds the liquidity pool and return the associated pair as well as the poolId.
   * The pool.liauiquidityToken is incorrect.
   * @param tokenFrom
   * @param tokenTo
   */
  public async getPoolDetails(tokenFrom: Token, tokenTo: Token) {
    //format input according to decimals

    const poolDetails = await this.findPool(tokenFrom, tokenTo);
    if (!poolDetails) return undefined;

    const poolTokenFrom = new TokenAmount(tokenFrom, poolDetails.liqReservesTokenFrom);
    const poolTokenTo = new TokenAmount(tokenTo, poolDetails.liqReservesTokenTo);
    //I'm cheating here and setting poolId inside the poolAddress field :)
    const poolPair = new Pair(poolTokenFrom, poolTokenTo, poolDetails.poolId);
    return {poolId: poolDetails.poolId, poolPair: poolPair};
  }

  /**
   * Given a from and two token and the pair associated to the liquidity pool, returns the execution price of the trade
   * and the minimum amount out.
   * @param from
   * @param to
   * @param pairFromTo
   * @param amountFrom
   * @param amountTo
   * @param slippageTolerance
   */
  private async findBestTrade(from: Token, to: Token, pairFromTo: Pair, amountFrom: string, amountTo: string, slippageTolerance: Percent): Promise<TradeInfo | undefined> {
    //Create poolPair to find the best trade for this poolPair. Use liq reserves as poolPair amounts
    let trade = Trade.bestTradeExactIn([pairFromTo], new TokenAmount(from, amountFrom), to)[0];


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


  public async getLiquidityPosition(starknetConnector: StarknetConnector, tokenFrom: Token, tokenTo: Token): Promise<PoolPosition> {
    const {account, provider} = starknetConnector;

    const poolDetails = await this.getPoolDetails(tokenFrom, tokenTo);
    const poolId = poolDetails.poolPair.pairAddress;

    const userBalance = await provider.callContract({
      contractAddress: MY_SWAP_ROUTER_ADDRESS,
      entrypoint: "get_lp_balance",
      calldata: [
        poolId,
        number.toBN(starknetConnector.account.address).toString()
      ]
    }).then((res) => res.result[0]);

    const totalSupply = await provider.callContract({
      contractAddress: MY_SWAP_ROUTER_ADDRESS,
      entrypoint: "get_total_shares",
      calldata: [poolId]
    }).then((res) => res.result[0]);

    const supply = new TokenAmount(new Token(ChainId.GÖRLI, "0", 18), totalSupply);
    const userLiquidity = new TokenAmount(new Token(ChainId.GÖRLI, "0", 18), userBalance);

    return {
      poolSupply: supply,
      userLiquidity: userLiquidity,
      poolPair: poolDetails.poolPair,
    }

  }


  /**
   * Returns all of a pool's detail
   * @param tokenFromDecAddress
   * @param tokenToDecAddress
   */
  private async findPool(tokenFrom: Token, tokenTo: Token): Promise<any> {

    //Convert addresses to BN
    const tokenFromDec = number.toBN(tokenFrom.address).toString()
    const tokenToDec = number.toBN(tokenTo.address)

    const targetPoolId = myswapLpMapping()[tokenFrom.address] ? myswapLpMapping()[tokenFrom.address][tokenTo.address] : undefined
    const mySwapRouterContract = new Contract(mySwapRouter.abi as Abi, MY_SWAP_ROUTER_ADDRESS);

    /**
     * Reads pool details and returns pool info
     * @param pool pool to read details from
     * @param i pool id
     */
    const readPoolDetails = (pool: any, i?: number) => {
      let liqReservesTokenFrom;
      let liqReservesTokenTo;
      if (pool[0].token_a_address.toString() === tokenFromDec) {
        liqReservesTokenFrom = uint256ToBN(pool[0].token_a_reserves).toString()
        liqReservesTokenTo = uint256ToBN(pool[0].token_b_reserves).toString()
      } else {
        liqReservesTokenFrom = uint256ToBN(pool[0].token_b_reserves).toString()
        liqReservesTokenTo = uint256ToBN(pool[0].token_a_reserves).toString()
      }
      return {
        poolId: i.toString(),
        poolName: pool[0].name,
        liqReservesTokenFrom: liqReservesTokenFrom,
        liqReservesTokenTo: liqReservesTokenTo,
        feePercentage: pool[0].fee_percentage.toString()
      };

    }


    //If not found in hardcoded values, just iterate for all pools.
    if (targetPoolId) {
      const pool = await mySwapRouterContract.call("get_pool", [targetPoolId]);
      return readPoolDetails(pool, targetPoolId);
    } else {
      return undefined;
      //For now there are only the 4 hardcoded pools
    }

    //   const numberOfPools = await mySwapRouterContract.call("get_total_number_of_pools");
    //   console.log(`Number of pools: ${numberOfPools}`);
    //   for (let i = 1; i <= Number(numberOfPools[0]); i++) {
    //     const pool = await mySwapRouterContract.call("get_pool", [i]);
    //     if (pool[0].token_a_address.toString() === tokenFromDecAddress && pool[0].token_b_address.toString() === tokenToDecAddress ||
    //       pool[0].token_a_address.toString() === tokenToDecAddress && pool[0].token_b_address.toString() === tokenFromDecAddress) {
    //       return readPoolDetails(pool, i);
    //     }
    //   }
    // }
  }
}
