import {number, Provider} from "starknet";
import {LiquidityPoolInputs} from "../utils/constants/interfaces";
import {Pair, TokenAmount} from "@jediswap/sdk";

export const getPair = async (provider:Provider, liquidityPoolInputs:LiquidityPoolInputs, findPool: Function) => {
  let {token0, token1 } = liquidityPoolInputs
  //format input according to decimals

  const tokenFromDec = number.toBN(token0.address)
  const tokenToDec = number.toBN(token1.address)

  const liquidityPool = await findPool(provider, tokenFromDec.toString(), tokenToDec.toString());
  if (!liquidityPool) return undefined;

  const poolToken0 = new TokenAmount(token0, liquidityPool.liqReservesToken0);
  const poolToken1 = new TokenAmount(token1, liquidityPool.liqReservesToken1);
  const pair_0_1 = new Pair(poolToken0, poolToken1);

  return pair_0_1;
}
