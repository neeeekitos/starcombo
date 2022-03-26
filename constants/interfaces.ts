export interface DexCombo {
  mint(): void;
  approve(): void
  swap(tokenFrom: string, tokenTo: string, amountIn: string, amountOut: string): Promise<any>;
  revoke(): void
  addLiquidity(): void
  removeLiquidity(): void
}
