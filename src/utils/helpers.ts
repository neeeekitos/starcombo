import {ChainId, Token} from "@jediswap/sdk";
import {StarknetConnector} from "./constants/interfaces";
import {ethers} from "ethers";
import {getTokenContract} from "../protocols/Jediswap/contracts";
import {uint256ToBN} from "starknet/dist/utils/uint256";

export async function getErc20Decimals(starknetConnector: StarknetConnector, address: string) {
  const tokenContract = getTokenContract(address, starknetConnector);
  return (await tokenContract.call('decimals').then((res) => parseInt(res[0])))
}

export async function createTokenObjects(starknetConnector: StarknetConnector, tokenAddressA: string, tokenAddressB: string) {

  const [tokenFromDecimals, tokenToDecimals] = await Promise.all([
    getErc20Decimals(starknetConnector, tokenAddressA),
    getErc20Decimals(starknetConnector, tokenAddressB),
  ]);

  const tokenFrom = new Token(
    ChainId.GÖRLI,
    tokenAddressA,
    tokenFromDecimals,
  )
  const tokenTo = new Token(
    ChainId.GÖRLI,
    tokenAddressB,
    tokenToDecimals,
  )
  return {tokenFrom, tokenTo}
}

/**
 * Returns BigNumber value of a user's ERC20 balance.
 * @param starknetConnector
 * @param token
 */
export const getBalanceOfErc20 = async (starknetConnector: StarknetConnector, token: Token) => {
  const tokenContract = getTokenContract(token.address, starknetConnector);

  //BN
  const balanceOf = tokenContract.call(
    "balanceOf", [starknetConnector.account.address])
    .then((res) => uint256ToBN(res.balance));

  // return BN
  return balanceOf


}

/**
 * Returns BigNumber value of an ERC20 contract's total supply.
 * @param starknetConnector
 * @param token
 */
export async function getTotalSupplyOfErc20(starknetConnector, token: Token) {
  const tokenContract = getTokenContract(token.address, starknetConnector);

  const totalSupply = tokenContract.call(
    "totalSupply", [starknetConnector.account.address])
    .then((res) => uint256ToBN(res.totalSupply));

  return totalSupply;
}

export function getFloatFromBN(BNvalue: string, decimals: number) {
  return parseFloat(ethers.utils.formatUnits(BNvalue, decimals));
}

export function formatToBigNumberish(amount:string,decimals:number){
  return ethers.utils.parseUnits(amount, decimals).toString();
}

export function formatToDecimal(bigValue:string,decimals:number){
  return ethers.utils.formatUnits(bigValue,decimals).toString();
}