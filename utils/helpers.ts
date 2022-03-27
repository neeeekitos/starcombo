import {Provider} from "starknet";
import {JEDI_REGISTRY_ADDRESS} from "./constants/contants";

export async function getErc20Decimals(provider:Provider,address:string){
  return await provider.callContract({
    contractAddress: address,
    entrypoint: "decimals",
  }).then((res) => res.result[0])
}