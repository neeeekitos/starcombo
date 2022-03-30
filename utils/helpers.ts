import {Provider} from "starknet";
import {JEDI_REGISTRY_ADDRESS} from "./constants/constants";
import {ChainId, Token} from "@jediswap/sdk";
import {StarknetConnector} from "./constants/interfaces";

export async function getErc20Decimals(provider:Provider,address:string){
  return await provider.callContract({
    contractAddress: address,
    entrypoint: "decimals",
  }).then((res) => res.result[0])
}

export async function createTokenObjects(starknetConnector:StarknetConnector,tokenAddressA:string,tokenAddressB:string){
  const tokenFromDecimals = await getErc20Decimals(starknetConnector.provider, tokenAddressA);
  const tokenToDecimals = await getErc20Decimals(starknetConnector.provider, tokenAddressB)

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

  return {tokenFrom,tokenTo}
}