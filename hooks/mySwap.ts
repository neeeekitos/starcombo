import {DexCombo, StarknetConnector, TradeInfo} from "../utils/constants/interfaces";
import {ethers} from "ethers";

import {Abi, AccountInterface, Call, Contract, number, Provider} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {Pair, Percent, Token, TokenAmount, Trade} from "@jediswap/sdk";
import BN from "bn.js";
import {fromEntries} from "@chakra-ui/utils";
import {MY_SWAP_ROUTER_ADDRESS} from "../utils/constants/constants";

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

  async getPoolDetails(tokenFrom: Token, tokenTo: Token) {
    //format input according to decimals

    const tokenFromAddress = number.toBN(tokenFrom.address)
    const tokenToAddress = number.toBN(tokenTo.address)

    const poolDetails = await this.findPool(tokenFromAddress.toString(), tokenToAddress.toString());
    if (!poolDetails) return undefined;

    const poolTokenFrom = new TokenAmount(tokenFrom, poolDetails.liqReservesTokenFrom);
    const poolTokenTo = new TokenAmount(tokenTo, poolDetails.liqReservesTokenTo);
    const pair_0_1 = new Pair(poolTokenFrom, poolTokenTo);
    return {poolId: poolDetails.poolId, poolPair: pair_0_1};
  }

  async findBestTrade(from: Token, to: Token, pairFromTo: Pair, amountFrom: string, amountTo: string, slippageTolerance: Percent): Promise<TradeInfo | undefined> {
    //Create pair to find the best trade for this pair. Use liq reserves as pair amounts
    console.log(pairFromTo, from, amountFrom, to)
    let trade = Trade.bestTradeExactIn([pairFromTo], new TokenAmount(from, amountFrom), to)[0];

    console.log(trade)
    console.log("execution price: $" + trade.executionPrice.toSignificant(6));
    console.log("price impact: " + trade.priceImpact.toSignificant(6) + "%");

    //TODO dynamic slippage value here
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = ethers.BigNumber.from(amountOutMin.toString()).toBigInt()

    return {
      executionPrice: trade.executionPrice.toSignificant(6),
      amountOutMin: amountOutMinDec.toString(),
    }

  }


  public async swap(starknetConnector: StarknetConnector, tokenFrom: Token, tokenTo: Token, amountIn: string, amountOut: string, pairFromTo?: Pair, poolId?: string): Promise<any> {
    const tokenFromDec = ethers.BigNumber.from(tokenFrom.address).toBigInt().toString();
    //parse amount in with correct decimals
    amountIn = ethers.utils.parseUnits(amountIn, tokenFrom.decimals).toString()
    const slippageTolerance = new Percent('50', '10000');
    const trade = await this.findBestTrade(tokenFrom, tokenTo, pairFromTo, amountIn, "0", slippageTolerance)
    if (!trade) return undefined;
    const tx = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(MY_SWAP_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          amountIn,
          "0"
        ]
      },
      {
        contractAddress: MY_SWAP_ROUTER_ADDRESS,
        entrypoint: "swap",
        calldata: [
          poolId,
          tokenFromDec,
          amountIn,
          "0",
          trade.amountOutMin,
          "0"
        ]
      }
    ]
    return tx;

  }

  addLiquidity(starknetConnector: StarknetConnector, pair_0_1: Pair, slippage: Percent, amountToken0: string): Promise<Call | Call[]> {
    return
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
   * Returns all of a pool's detail
   * @param tokenFromDecAddress
   * @param tokenToDecAddress
   */
  async findPool(tokenFromDecAddress: string, tokenToDecAddress: string): Promise<any> {
    const mySwapRouterContract = new Contract(mySwapRouter.abi as Abi, "0x071faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e");
    const numberOfPools = await mySwapRouterContract.call("get_total_number_of_pools");
    console.log(`Number of pools: ${numberOfPools}`);
    for (let i = 1; i <= Number(numberOfPools[0]); i++) {
      const pool = await mySwapRouterContract.call("get_pool", [i]);
      if (pool[0].token_a_address.toString() === tokenFromDecAddress && pool[0].token_b_address.toString() === tokenToDecAddress ||
        pool[0].token_a_address.toString() === tokenToDecAddress && pool[0].token_b_address.toString() === tokenFromDecAddress) {

        let liqReservesTokenFrom;
        let liqReservesTokenTo;
        if (pool[0].token_a_address.toString() === tokenFromDecAddress) {
          liqReservesTokenFrom = pool[0].token_a_reserves.low.toString();
          liqReservesTokenTo = pool[0].token_b_reserves.low.toString();
        } else {
          liqReservesTokenFrom = pool[0].token_b_reserves.low.toString();
          liqReservesTokenTo = pool[0].token_a_reserves.low.toString();
        }
        return Promise.resolve({
          poolId: i.toString(),
          liqReservesTokenFrom: liqReservesTokenFrom,
          liqReservesTokenTo: liqReservesTokenTo
        });

      }
    }
    return Promise.reject("Pool not found");
  }
}
