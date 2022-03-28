import {DexCombo, StarknetConnector} from "../utils/constants/interfaces";
import {JEDI_ROUTER_ADDRESS, MY_SWAP_ROUTER_ADDRESS} from "../utils/constants/contants";
import {ethers} from "ethers";
import {Abi, AccountInterface, Call, Contract, Provider} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {Pair, Percent, Token} from "@jediswap/sdk";

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

  public async swap(starknetConnector: StarknetConnector, tokenFrom: Token, tokenTo: Token, amountIn: string, amountOut: string): Promise<any> {
    //TODO calculate amountOut manually?
    const tokenFromDec = ethers.BigNumber.from(tokenFrom.address).toBigInt().toString();
    const tokenToDec = ethers.BigNumber.from(tokenTo.address).toBigInt().toString();
    const poolId = await this.findPool(tokenFromDec, tokenToDec);
    console.log(poolId)

    const tx = [
      {
        contractAddress: MY_SWAP_ROUTER_ADDRESS,
        entrypoint: "swap",
        calldata: [
          poolId,
          tokenToDec,
          amountIn,
          "0",
          amountOut,
          "0"
        ]
      }
    ]
    return tx;

  }

  addLiquidity(starknetConnector: StarknetConnector, pair_0_1: Pair,slippage:Percent,amountToken0:string): Promise<Call | Call[]> {
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

  async findPool(tokenFromDec: string, tokenToDec: string): Promise<string> {
    const mySwapRouterContract = new Contract(mySwapRouter.abi as Abi, "0x071faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e");
    const numberOfPools = await mySwapRouterContract.call("get_total_number_of_pools");
    console.log(`Number of pools: ${numberOfPools}`);
    for (let i = 1; i <= Number(numberOfPools[0]); i++) {
      const pool = await mySwapRouterContract.call("get_pool", [i]);
      if (pool[0].token_a_address.toString() === tokenFromDec && pool[0].token_b_address.toString() === tokenToDec ||
        pool[0].token_a_address.toString() === tokenToDec && pool[0].token_b_address.toString() === tokenFromDec) {
        return Promise.resolve(i.toString());
      }
    }
    return Promise.reject("Pool not found");
  }
}
