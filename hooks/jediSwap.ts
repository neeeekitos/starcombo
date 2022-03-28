import {
  DexCombo,
  findPoolRes,
  LiquidityPoolInfo,
  LiquidityPoolInputs,
  StarknetConnector, SwapParameters, TradeInfo
} from "../utils/constants/interfaces";
import {Abi, AccountInterface, Call, Contract, Provider, stark} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {JEDI_REGISTRY_ADDRESS, JEDI_ROUTER_ADDRESS, SLIPPAGE} from "../utils/constants/constants";
import {ethers} from "ethers";
import {useStarknet} from "./useStarknet";
import {BigintIsh, ChainId, Pair, Percent, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {loadGetInitialProps} from "next/dist/shared/lib/utils";
import {number} from "starknet";


export class JediSwap implements DexCombo {

  protected static instance: JediSwap;

  protected constructor() {
  }

  public static getInstance(): JediSwap {
    if (!JediSwap.instance) {
      JediSwap.instance = new JediSwap();
    }

    return JediSwap.instance;
  }

  /**
   * Given two tokens, finds the liquidity pool and returns the Pair associated.
   * @param provider
   * @param tokenFrom
   * @param tokenTo
   */
  async getPair(provider: Provider, tokenFrom: Token, tokenTo: Token) {

    const tokenFromDec = number.toBN(tokenFrom.address)
    const tokenToDec = number.toBN(tokenTo.address)

    const liquidityPool = await this.findPool(provider, tokenFromDec.toString(), tokenToDec.toString());
    if (!liquidityPool) return undefined;

    const poolToken0 = new TokenAmount(tokenFrom, liquidityPool.liqReservesTokenFrom);
    const poolToken1 = new TokenAmount(tokenTo, liquidityPool.liqReservesTokenTo);
    const poolPair = new Pair(poolToken0, poolToken1,liquidityPool.liqPoolAddress);

    return poolPair;
  }

  /**
   * Given 2 tokens and amounts aswell as a specified slippage, returns the address of the liquidity pool, the desired and minimum amounts for each tokens according
   * to slippage, as well as the prices of token0<>token1.
   * @param provider Starknet Provider
   * @param token0 Token0 object
   * @param token1 Token1 object
   * @param amount0 amount of token0 we want to provide liquidity for. 0 if we
   * @param amount1 amount of token0 we want to provide liquidity for.
   * @param slippage
   */
  async getLiquidityDetails(provider: Provider, liquidityPoolInputs: LiquidityPoolInputs, pair_0_1: Pair): Promise<LiquidityPoolInfo> {

    let {token0, token1, amountToken0, amountToken1, slippage} = liquidityPoolInputs
    //format input according to decimals
    amountToken0 = ethers.utils.parseUnits(amountToken0, token0.decimals).toString();

    //get output amt for token input
    const outputAmt = pair_0_1.getOutputAmount(new TokenAmount(token0, amountToken0));
    const rawOutputAmt = ethers.BigNumber.from(outputAmt[0].raw.toString());

    const desiredAmount0 = ethers.BigNumber.from(amountToken0);
    const minAmount0 = desiredAmount0.sub(slippage.multiply(desiredAmount0.toBigInt()).toFixed(0)).toString()
    const desiredAmount1 = rawOutputAmt;
    const minAmount1 = desiredAmount1.sub(slippage.multiply(desiredAmount1.toBigInt()).toFixed(0)).toString()

    console.log(token0, token1)

    const price0to1 = pair_0_1.token0Price.toSignificant();
    const price1to0 = pair_0_1.token1Price.toSignificant()
    console.log(price1to0, price0to1)


    return {
      liqReservesToken0: pair_0_1.reserve0.raw.toString(),
      liqReservesToken1: pair_0_1.reserve1.raw.toString(),
      desiredAmount0: desiredAmount0.toString(),
      desiredAmount1: desiredAmount1.toString(),
      minAmount0: minAmount0,
      minAmount1: minAmount1,
      price0to1: price0to1,
      price1to0: price1to0
    };

  }

  /**
   * Adds liquidity to the liquidity pool associated to the pair.
   * @param starknetConnector
   * @param poolPair
   * @param slippage
   * @param tokenAmountFrom
   */
  async addLiquidity(starknetConnector: StarknetConnector, poolPair: Pair, slippage: Percent, tokenAmountFrom: TokenAmount): Promise<Call | Call[]> {

    //TODO check if it's ok if amtToken0 corresponds to pool token 1
    //TODO check if there's another way to add fixed amountToken1 ? This works only if amountTokenFrom refers to Token0.

    //Add liquidity to pool with poolPair 0 and poolPair 1.
    //We provide tokenAmountFrom:TokenAmount.
    //so if token0 == tokenFrom we're gucci otherwise we must invert the values.
    const tokenFromIsToken0 = tokenAmountFrom.token.address === poolPair.token0.address;
    const tokenFromDec = ethers.BigNumber.from(poolPair.token0.address).toBigInt().toString()
    const tokenToDec = ethers.BigNumber.from(poolPair.token1.address).toBigInt().toString()
    const token0Dec = tokenFromIsToken0 ? tokenFromDec:tokenToDec;
    const token1Dec = tokenFromIsToken0 ? tokenToDec:tokenFromDec


    //get output amt for token input
    let outputAmt, desiredAmount0, rawOutputAmt, minAmount0, desiredAmount1, minAmount1;
    if (tokenFromIsToken0) {
      outputAmt = poolPair.getOutputAmount(new TokenAmount(poolPair.token0, tokenAmountFrom.raw.toString()));
      desiredAmount0 = ethers.BigNumber.from(tokenAmountFrom.raw.toString());
      rawOutputAmt = ethers.BigNumber.from(outputAmt[0].raw.toString());
      minAmount0 = desiredAmount0.sub(slippage.multiply(desiredAmount0.toBigInt()).toFixed(0)).toString()
      desiredAmount1 = rawOutputAmt;
      minAmount1 = desiredAmount1.sub(slippage.multiply(desiredAmount1.toBigInt()).toFixed(0)).toString()

    } else {
      outputAmt = poolPair.getOutputAmount(new TokenAmount(poolPair.token1, tokenAmountFrom.raw.toString()));
      desiredAmount1 = ethers.BigNumber.from(tokenAmountFrom.raw.toString());
      rawOutputAmt = ethers.BigNumber.from(outputAmt[0].raw.toString());
      minAmount1 = desiredAmount1.sub(slippage.multiply(desiredAmount1.toBigInt()).toFixed(0)).toString()
      desiredAmount0 = rawOutputAmt;
      minAmount0 = desiredAmount1.sub(slippage.multiply(desiredAmount0.toBigInt()).toFixed(0)).toString()
    }

    const tx = [
      {
        contractAddress: poolPair.token0.address,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(JEDI_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          desiredAmount0.toString(),
          "0"
        ]
      },
      {
        contractAddress: poolPair.token1.address,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(JEDI_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          desiredAmount1.toString(),
          "0"
        ]
      },
      {
        contractAddress: JEDI_ROUTER_ADDRESS,
        entrypoint: 'add_liquidity',
        calldata: [
          token0Dec,
          token1Dec,
          desiredAmount0.toString(),
          "0",
          desiredAmount1.toString(),
          "0",
          minAmount0,
          "0",
          minAmount1,
          "0",
          ethers.BigNumber.from(starknetConnector.account.address).toBigInt().toString(),
          Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
        ]
      }
    ];
    return tx;
  }

  approve(): void {
  }

  mint(): void {
  }

  removeLiquidity(): void {
  }

  revoke(): void {
  }

  /**
   * Returns the transaction details to perform a swap between two tokens
   * @param starknetConnector
   * @param swapParameters
   * @param poolId
   */
  public async swap(starknetConnector: StarknetConnector, swapParameters: SwapParameters): Promise<any> {
    let {tokenFrom, tokenTo, amountIn, amountOut, poolPair} = swapParameters;
    //TODO handle when user specifies amountOut
    //DONT USE PARSE ETHER BECAUSE OUR TOKENS ARE NOT 18 DEC
    amountIn = ethers.utils.parseUnits(amountIn, tokenFrom.decimals).toString();
    amountOut = ethers.utils.parseUnits(amountOut, tokenTo.decimals).toString();

    const trade = await this.findBestTrade(tokenFrom, tokenTo, poolPair, amountIn, amountOut, SLIPPAGE)
    if (!trade) return undefined;

    //flatten the array because trade.pathAddresses is a subarray
    const swapCallData = [
      amountIn,
      "0",
      trade.amountOutMin,
      "0",
      trade.pathLength,
      trade.pathAddresses,
      ethers.BigNumber.from(starknetConnector.account.address).toBigInt().toString(),
      Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
    ].flatMap((x) => x);

    const tx = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(JEDI_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          amountIn,
          "0"
        ]
      },
      {
        contractAddress: JEDI_ROUTER_ADDRESS,
        entrypoint: 'swap_exact_tokens_for_tokens',
        calldata: swapCallData
      }
    ];
    return tx;

  }

  /**
   * Given two decimal tokens addresses, finds the associated pool and returns details about the liquidity pool (address, token0, reserves).
   * @param provider
   * @param tokenFromDecAddress
   * @param tokenToDecAddress
   */
  async findPool(provider: Provider, tokenFromDecAddress: string, tokenToDecAddress: string): Promise<findPoolRes | undefined> {

    //Gets liq pool address for tokenFrom - tokenTo pool
    const liquidityPoolForTokens = await provider.callContract({
      contractAddress: JEDI_REGISTRY_ADDRESS,
      entrypoint: "get_pair_for",
      calldata: [
        tokenFromDecAddress,
        tokenToDecAddress
      ]
    }).then((res) => res.result[0])
    if (!liquidityPoolForTokens) return undefined

    //Gets address of pool's token0
    const liqPoolToken0 = await provider.callContract({
      contractAddress: liquidityPoolForTokens,
      entrypoint: "token0",
    }).then((res) => ethers.BigNumber.from(res.result[0]).toString())
    if (!liqPoolToken0) return undefined

    // Gets reserves for the tokenA tokenB liq pool
    const liqReserves = await provider.callContract({
      contractAddress: liquidityPoolForTokens!,
      entrypoint: "get_reserves",
    }).then((res) => res.result);
    if (!liqPoolToken0) return undefined

    //Correctly map our token0 (tokenFrom) to the pool's token0
    let liqReservesTokenFrom = liqPoolToken0 === tokenFromDecAddress ? liqReserves[0] : liqReserves[2];
    let liqReservesTokenTo = liqPoolToken0 === tokenFromDecAddress ? liqReserves[2] : liqReserves[0];

    return {
      liqPoolAddress: liquidityPoolForTokens,
      liqPoolToken0: liqPoolToken0,
      liqReservesTokenFrom: liqReservesTokenFrom,
      liqReservesTokenTo: liqReservesTokenTo
    }
  }

  async findBestTrade(from: Token, to: Token, pairFromTo: Pair, amountFrom: string, amountTo: string, slippageTolerance: Percent): Promise<TradeInfo | undefined> {
    //Create poolPair to find the best trade for this poolPair. Use liq reserves as poolPair amounts
    let trade: Trade;
    console.log(pairFromTo, from, amountFrom, to)
    if (amountTo === "0") {
      trade = Trade.bestTradeExactIn([pairFromTo], new TokenAmount(from, amountFrom), to)[0];

    } else {
      trade = Trade.bestTradeExactOut([pairFromTo], from, new TokenAmount(from, amountFrom))[0];
    }

    console.log(trade)
    console.log("execution price: $" + trade.executionPrice.toSignificant(6));
    console.log("price impact: " + trade.priceImpact.toSignificant(6) + "%");

    //TODO dynamic slippage value here
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = ethers.BigNumber.from(amountOutMin.toString()).toBigInt()

    const path = trade.route.path;
    const pathAddresses = path.map((token: Token) => ethers.BigNumber.from(token.address.toString()).toBigInt().toString());
    return {
      pathLength: path.length.toString(),
      pathAddresses: pathAddresses,
      executionPrice: trade.executionPrice.toSignificant(6),
      amountOutMin: amountOutMinDec.toString(),
    }

  }


}
