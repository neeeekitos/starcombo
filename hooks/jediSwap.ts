import {DexCombo} from "../constants/interfaces";
import {Abi, AccountInterface, Contract, Provider} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {JEDI_REGISTRY_ADDRESS, JEDI_ROUTER_ADDRESS} from "../constants/contants";
import {ethers} from "ethers";
import {useStarknet} from "./useStarknet";
import {BigintIsh, ChainId, Pair, Percent, Token, TokenAmount, Trade} from "@jediswap/sdk";

interface findPoolRes {
  liqPoolAddress: string,
  liqPoolToken0: string,
  liqReservesTokenFrom: BigintIsh,
  liqReservesTokenTo: BigintIsh
}

interface TradePath {
  pathLength: string,
  pathAddresses: Array<string>,
  amountOutMin:string
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

  addLiquidity(): void {
  }

  approve(): void {
  }

  mint(): void {
  }

  removeLiquidity(): void {
  }

  revoke(): void {
  }

  public async swap(account:AccountInterface,provider:Provider,tokenFrom: string, tokenTo: string, amountIn: string, amountOut: string): Promise<any> {
    //TODO handle when user specifies amountOut

    //We need these but idk why tbh
    const from = new Token(
      ChainId.GÖRLI,
      tokenFrom,
      18,
      't0'
    )
    const to = new Token(
      ChainId.GÖRLI,
      tokenTo,
      18,
      't1'
    )

    const tokenFromDec = ethers.BigNumber.from(tokenFrom).toBigInt().toString()
    const tokenToDec = ethers.BigNumber.from(tokenTo).toBigInt().toString()

    const liquidityPool = await this.findPool(provider, tokenFromDec, tokenToDec);
    if(!liquidityPool) return undefined;
    const trade = await this.findBestTrade(from,to,liquidityPool.liqReservesTokenFrom,liquidityPool.liqReservesTokenTo,amountIn)
    if(!trade) return undefined;

    const swapCallData = [
      amountIn,
      "0",
      trade.amountOutMin,
      "0",
      trade.pathLength,
      trade.pathAddresses,
      ethers.BigNumber.from(account.address).toBigInt().toString(),
      Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
    ].flatMap((x) => x);

    const tx = [
      {
        contractAddress: tokenFrom,
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
    return await account.execute(tx);

  }

  async findPool(provider: Provider, tokenFromDec: string, tokenToDec: string): Promise<findPoolRes | undefined> {

    console.log(JEDI_REGISTRY_ADDRESS)
    console.log(tokenFromDec)
    console.log(tokenToDec)
    console.log("finding pool")
    const liquidityPoolForTokens = await provider.callContract({
      contractAddress: JEDI_REGISTRY_ADDRESS,
      entrypoint: "get_pair_for",
      calldata: [
        tokenFromDec,
        tokenToDec
      ]
    }).then((res) => res.result[0])
    if (!liquidityPoolForTokens) return undefined

    const liqPoolToken0 = await provider.callContract({
      contractAddress: liquidityPoolForTokens,
      entrypoint: "token0",
    }).then((res) => ethers.BigNumber.from(res.result[0]).toString())
    if (!liqPoolToken0) return undefined

    // get reserves for the tokenA tokenB liq pool
    const liqReserves = await provider.callContract({
      contractAddress: liquidityPoolForTokens!,
      entrypoint: "get_reserves",
    }).then((res) => res.result);
    if (!liqPoolToken0) return undefined

    let liqReserveTokenFrom = liqPoolToken0 === tokenFromDec ? liqReserves[0] : liqReserves[2];
    let liqReserveTokenTo = liqPoolToken0 === tokenFromDec ? liqReserves[2] : liqReserves[0];

    return {
      liqPoolAddress: liquidityPoolForTokens,
      liqPoolToken0: liqPoolToken0,
      liqReservesTokenFrom: liqReserveTokenFrom,
      liqReservesTokenTo: liqReserveTokenTo
    }
  }

  async findBestTrade(from: Token, to: Token, liqReserveTokenFrom: BigintIsh, liqReserveTokenTo: BigintIsh, amountFrom: string): Promise<TradePath | undefined> {
    //Create pair to find the best trade for this pair. Use liq reserves as pair amounts
    const pair_0_1 = new Pair(new TokenAmount(from, liqReserveTokenFrom), new TokenAmount(to, liqReserveTokenTo))

    const trade = Trade.bestTradeExactIn([pair_0_1], new TokenAmount(from, amountFrom), to)[0];
    console.log(trade)
    console.log("execution price: $" + trade.executionPrice.toSignificant(6));
    console.log("price impact: " + trade.priceImpact.toSignificant(6) + "%");

    //TODO dynamic slippage value here
    const slippageTolerance = new Percent('50', '10000'); // 0.5%
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = ethers.BigNumber.from(amountOutMin.toString()).toBigInt()

    const path = trade.route.path;
    const pathAddresses = path.map((token: Token) => ethers.BigNumber.from(token.address.toString()).toBigInt().toString());
    return {
      pathLength: path.length.toString(),
      pathAddresses: pathAddresses,
      amountOutMin:amountOutMinDec.toString(),
    }

  }


}
