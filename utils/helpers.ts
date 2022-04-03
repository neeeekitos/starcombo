import {number, Provider} from "starknet";
import {JEDI_REGISTRY_ADDRESS} from "./constants/constants";
import {ChainId, Token} from "@jediswap/sdk";
import {StarknetConnector} from "./constants/interfaces";
import {add} from "@noble/hashes/_u64";
import {ethers} from "ethers";

export async function getErc20Decimals(provider: Provider, address: string) {
  return await provider.callContract({
    contractAddress: address,
    entrypoint: "decimals",
  }).then((res) => res.result[0])
}

export async function createTokenObjects(starknetConnector: StarknetConnector, tokenAddressA: string, tokenAddressB: string) {

  const [tokenFromDecimals, tokenToDecimals] = await Promise.all([
    getErc20Decimals(starknetConnector.provider, tokenAddressA),
    getErc20Decimals(starknetConnector.provider, tokenAddressB)
  ]);
  const tokenFrom = new Token(
    ChainId.GÖRLI,
    tokenAddressA,
    parseInt(tokenFromDecimals),
  )
  const tokenTo = new Token(
    ChainId.GÖRLI,
    tokenAddressB,
    parseInt(tokenToDecimals),
  )
  return {tokenFrom, tokenTo}
}

export const getBalanceOfErc20 = async (starknetConnector:StarknetConnector, token: Token) => {
  const balanceOf = await starknetConnector.provider.callContract({
    contractAddress: token.address.toString(),
    entrypoint: "balanceOf",
    calldata: [
      number.toBN(starknetConnector.account.address).toString()
    ]
  }).then((res) => {
   return ethers.utils.formatUnits(res.result[0],token.decimals);
  })

  return balanceOf;
}