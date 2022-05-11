import {Abi, Contract} from 'starknet'
import JediswapPairABI from '../../contracts/artifacts/abis/jediswap/Pair.json'
import ERC20_ABI from '../../contracts/artifacts/abis/jediswap/erc20.json'
import {isAddress} from '../../utils'
import REGISTRY_ABI from '../../contracts/artifacts/abis/jediswap/Registry.json'
import {REGISTRY_ADDRESS, ROUTER_ADDRESS, ZAP_IN_ADDRESS} from './constants';
import JediSwapRouterABI from '../../contracts/artifacts/abis/jediswap/Router.json'
import {StarknetConnector} from "../../utils/constants/interfaces";
import {ZERO_ADDRESS} from "../../utils/constants/constants";

// returns null on errors
function getContract(address: string | undefined, ABI: any, starknetConnector: StarknetConnector): Contract | null {
  const {provider, account} = starknetConnector

  if (!address || !ABI || !provider) return null

  try {
    const parsedAddress = isAddress(address)
    if (!parsedAddress || parsedAddress === ZERO_ADDRESS) {
      throw Error(`Invalid 'address' parameter '${address}'.`)
    }
    return new Contract(ABI as Abi, address)
  } catch (error) {
    console.error('Failed to get contract', error)
    return null
  }
}

export function getTokenContract(tokenAddress: string, starknetConnector: StarknetConnector): Contract | null {
  return getContract(tokenAddress, ERC20_ABI, starknetConnector)
}

export function getPairContract(pairAddress: string, starknetConnector: StarknetConnector): Contract | null {
  return getContract(pairAddress, JediswapPairABI, starknetConnector)
}

export function getRegistryContract(starknetConnector: StarknetConnector): Contract | null {
  return getContract(REGISTRY_ADDRESS, REGISTRY_ABI, starknetConnector)
}

export function getRouterContract(starknetConnector: StarknetConnector): Contract | null {
  return getContract(ROUTER_ADDRESS, JediSwapRouterABI, starknetConnector)
}

// export function useMulticallContract(): Contract | null {
//   const { chainId } = useActiveStarknetReact()
//
//   return useContract(MULTICALL_NETWORKS[chainId ?? 5], MULTICALL_ABI, false)
// }

// export function useZapInContract(): Contract | null {
//   return useContract(ZAP_IN_ADDRESS, JediSwapZapInABI, true)
// }
