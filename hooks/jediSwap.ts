import {DexCombo, LiquidityPoolInfo, LiquidityPoolInputs, StarknetConnector} from "../utils/constants/interfaces";
import {Abi, AccountInterface, Call, Contract, Provider, stark} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {JEDI_REGISTRY_ADDRESS, JEDI_ROUTER_ADDRESS} from "../utils/constants/contants";
import {ethers} from "ethers";
import {useStarknet} from "./useStarknet";
import {BigintIsh, ChainId, Pair, Percent, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {loadGetInitialProps} from "next/dist/shared/lib/utils";
import {number} from "starknet";


interface findPoolRes {
  liqPoolAddress: string,
  liqPoolToken0: string,
  liqReservesToken0: BigintIsh,
  liqReservesToken1: BigintIsh
}

interface TradeInfo {
  pathLength: string,
  pathAddresses: Array<string>,
  executionPrice: string,
  amountOutMin: string
}

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

  async getPair(provider:Provider, liquidityPoolInputs:LiquidityPoolInputs){
    let {token0, token1 } = liquidityPoolInputs
    //format input according to decimals

    const tokenFromDec = number.toBN(token0.address)
    const tokenToDec = number.toBN(token1.address)

    const liquidityPool = await this.findPool(provider, tokenFromDec.toString(), tokenToDec.toString());
    if (!liquidityPool) return undefined;

    const poolToken0 = new TokenAmount(token0, liquidityPool.liqReservesToken0);
    const poolToken1 = new TokenAmount(token1, liquidityPool.liqReservesToken1);
    const pair_0_1 = new Pair(poolToken0, poolToken1);

    return pair_0_1;
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
  async getLiquidityDetails(provider: Provider, liquidityPoolInputs: LiquidityPoolInputs, pair_0_1:Pair): Promise<LiquidityPoolInfo> {

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

    console.log(token0,token1)

    const price0to1 =pair_0_1.token0Price.toSignificant();
    const price1to0 =pair_0_1.token1Price.toSignificant()
    console.log(price1to0,price0to1)



    return {
      liqReservesToken0:pair_0_1.reserve0.raw.toString(),
      liqReservesToken1:pair_0_1.reserve1.raw.toString(),
      desiredAmount0: desiredAmount0.toString(),
      desiredAmount1: desiredAmount1.toString(),
      minAmount0: minAmount0,
      minAmount1: minAmount1,
      price0to1: price0to1,
      price1to0: price1to0
    };

  }

  async addLiquidity(starknetConnector: StarknetConnector, pair_0_1: Pair,slippage:Percent,amountToken0:string): Promise<Call | Call[]> {

    amountToken0 = ethers.utils.parseUnits(amountToken0, pair_0_1.token0.decimals).toString();

    //get output amt for token input
    const outputAmt = pair_0_1.getOutputAmount(new TokenAmount(pair_0_1.token0, amountToken0));
    const rawOutputAmt = ethers.BigNumber.from(outputAmt[0].raw.toString());

    const desiredAmount0 = ethers.BigNumber.from(amountToken0);
    const minAmount0 = desiredAmount0.sub(slippage.multiply(desiredAmount0.toBigInt()).toFixed(0)).toString()
    const desiredAmount1 = rawOutputAmt;
    const minAmount1 = desiredAmount1.sub(slippage.multiply(desiredAmount1.toBigInt()).toFixed(0)).toString()

    const token0Dec = ethers.BigNumber.from(pair_0_1.token0.address).toBigInt().toString()
    const token1Dec = ethers.BigNumber.from(pair_0_1.token1.address).toBigInt().toString()

    const tx = [
      {
        contractAddress: pair_0_1.token0.address,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(JEDI_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          desiredAmount0.toString(),
          "0"
        ]
      },
      {
        contractAddress: pair_0_1.token1.address,
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

  public async swap(starknetConnector:StarknetConnector, tokenFrom: Token, tokenTo: Token, amountIn: string, amountOut: string, pair?:Pair): Promise<any> {
    //TODO handle when user specifies amountOut

    //DONT USE PARSE ETHER BECAUSE OUR TOKENS ARE NOT 18 DEC
    amountIn = ethers.utils.parseUnits(amountIn, tokenFrom.decimals).toString();
    amountOut = ethers.utils.parseUnits(amountOut, tokenTo.decimals).toString();

    //We need these for liquidity calculations

    const tokenFromDec = ethers.BigNumber.from(tokenFrom.address).toBigInt().toString()
    const tokenToDec = ethers.BigNumber.from(tokenTo.address).toBigInt().toString()

    const liquidityPool = await this.findPool(starknetConnector.provider, tokenFromDec, tokenToDec);
    if (!liquidityPool) return undefined;

    const slippageTolerance = new Percent('50', '10000'); // 0.5%

    const trade = await this.findBestTrade(tokenFrom, tokenTo, pair, amountIn, amountOut, slippageTolerance)
    if (!trade) return undefined;

    //flatten the array because traade.pathAddresses is a subarray
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

  async findPool(provider: Provider, token0DecAdress: string, token1DecAddress: string): Promise<findPoolRes | undefined> {

    //Gets liq pool address for tokenFrom - tokenTo pool
    const liquidityPoolForTokens = await provider.callContract({
      contractAddress: JEDI_REGISTRY_ADDRESS,
      entrypoint: "get_pair_for",
      calldata: [
        token0DecAdress,
        token1DecAddress
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
    let liqReservesToken0 = liqPoolToken0 === token0DecAdress ? liqReserves[0] : liqReserves[2];
    let liqReservesToken1 = liqPoolToken0 === token0DecAdress ? liqReserves[2] : liqReserves[0];

    return {
      liqPoolAddress: liquidityPoolForTokens,
      liqPoolToken0: liqPoolToken0,
      liqReservesToken0: liqReservesToken0,
      liqReservesToken1: liqReservesToken1
    }
  }

  async findBestTrade(from: Token, to: Token, pairFromTo: Pair, amountFrom: string, amountTo: string, slippageTolerance: Percent): Promise<TradeInfo | undefined> {
    //Create pair to find the best trade for this pair. Use liq reserves as pair amounts
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
