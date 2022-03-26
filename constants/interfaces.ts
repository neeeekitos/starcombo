import {AccountInterface} from "starknet";
import {Provider} from "starknet";

export interface DexCombo {
  mint(): void;
  approve(): void
  swap(account: AccountInterface, provider:Provider,tokenFrom: string, tokenTo: string, amountIn: string, amountOut: string): Promise<any>;
  revoke(): void
  addLiquidity(): void
  removeLiquidity(): void
}
