export interface DexCombo {
  mint(): void;
  approve(): void
  swap(): void
  revoke(): void
  addLiquidity(): void
  removeLiquidity(): void
}
