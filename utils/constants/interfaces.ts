import {AccountInterface} from "starknet";
import {Provider} from "starknet";
import {BigintIsh, Pair, Percent, Token} from "@jediswap/sdk";

export interface DexCombo {
  mint(): void;

  approve(): void

  swap(starknetConnector:StarknetConnector, tokenFrom: Token, tokenTo: Token, amountIn: string, amountOut: string, pair?:Pair): Promise<any>;

  revoke(): void

  addLiquidity(starknetConnector: StarknetConnector, pair_0_1: Pair,slippage:Percent,amountToken0:string): Promise<any>

  removeLiquidity(): void
}

export interface StarknetConnector {
  account: AccountInterface,
  provider: Provider
}

export interface LiquidityPoolInputs {
  token0: Token,
  token1: Token,
  amountToken0?: string,
  amountToken1?: string,
  slippage?: Percent
}

export interface LiquidityPoolInfo {
  liquidityPool?: string,
  liqReservesToken0:BigintIsh,
  liqReservesToken1:BigintIsh,
  desiredAmount0: string,
  desiredAmount1: string,
  minAmount0: string,
  minAmount1: string,
  price0to1: string,
  price1to0: string,
}