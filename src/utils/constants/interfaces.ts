import {AccountInterface, Provider} from "starknet";
import {BigintIsh, Pair, Percent, Token, TokenAmount} from "@jediswap/sdk";
import {PoolPosition} from "../../protocols/Jediswap/jediSwap";
import {Action} from "./constants";

export interface DexCombo {
  mint(): void;

  approve(): void

  getPoolDetails(tokenFrom: Token, tokenTo: Token, provider?: Provider)

  getLiquidityPosition(starknetConnector: StarknetConnector, token0: Token, token1: Token, poolPair?: Pair)

  getSwapExecutionPrice(starknetConnector: StarknetConnector, swapParameters: SwapParameters);

  /**
   * Returns the transaction for a swap operation
   * @param starknetConnector
   * @param swapParameters
   * @param poolId
   */
  swap(starknetConnector: StarknetConnector, swapParameters: SwapParameters, poolId?: string): Promise<Action>;

  revoke(): void

  addLiquidity(starknetConnector: StarknetConnector, poolPair: Pair, slippage: Percent, tokenAmountFrom: TokenAmount): Promise<Action>;

  /**
   * Returns the transaction for an add liquidity opeartion
   * @param starknetConnector
   * @param poolPair
   * @param slippage
   * @param tokenAmountFrom
   */
  addLiquidity(starknetConnector: StarknetConnector, poolPair: Pair, slippage: Percent, tokenAmountFrom: TokenAmount): Promise<Action>;

  removeLiquidity(starknetConnector: StarknetConnector, poolPosition: PoolPosition, liqToRemove: TokenAmount): Promise<Action>;
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
  liqReservesToken0: BigintIsh,
  liqReservesToken1: BigintIsh,
  desiredAmount0: string,
  desiredAmount1: string,
  minAmount0: string,
  minAmount1: string,
  price0to1: string,
  price1to0: string,
}


export interface findPoolRes {
  liqReservesTokenFrom: BigintIsh,
  liqReservesTokenTo: BigintIsh
  liqPoolAddress?: string,
  liqPoolToken0?: string,
  poolId?: string

}

export interface TradeInfo {
  executionPrice: string,
  amountOutMin: string
  pathLength?: string,
  pathAddresses?: Array<string>,

}

export interface SwapParameters {
  tokenFrom: Token,
  tokenTo: Token,
  amountIn: string,
  amountOut: string,
  poolPair: Pair,
  poolId?:string
}

export interface OperationsState {
  inputs: {
    [key: string]: number
  }
  outputs: {
    [key: string]: number
  }
}