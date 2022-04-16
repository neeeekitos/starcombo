import {Abi, Contract, number, Provider} from "starknet";
import {JEDI_REGISTRY_ADDRESS} from "./constants/constants";
import {ChainId, CurrencyAmount, Token} from "@jediswap/sdk";
import {StarknetConnector} from "./constants/interfaces";
import {add} from "@noble/hashes/_u64";
import {ethers} from "ethers";
import {getTokenContract} from "./jediswap/contracts";
import {uint256ToBN} from "starknet/dist/utils/uint256";
import JSBI from "jsbi";

export async function getErc20Decimals(starknetConnector: StarknetConnector, address: string) {
  const tokenContract = getTokenContract(address, starknetConnector);
  return (await tokenContract.call('decimals').then((res) => parseInt(res[0])))
}

export async function createTokenObjects(starknetConnector: StarknetConnector, tokenAddressA: string, tokenAddressB: string) {

  const [tokenFromDecimals, tokenToDecimals] = await Promise.all([
    getErc20Decimals(starknetConnector,tokenAddressA),
    getErc20Decimals(starknetConnector,tokenAddressB),
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

export const getBalanceOfErc20 = async (starknetConnector: StarknetConnector, token: Token) => {
  const tokenContract = getTokenContract(token.address, starknetConnector);

  //BN
  const balanceOf = (await tokenContract.call(
    "balanceOf",[starknetConnector.account.address])
  .then((res)=> uint256ToBN(res.balance)));

  //decimal value
  return ethers.utils.formatUnits(balanceOf.toString(),token.decimals);

}