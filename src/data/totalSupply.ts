import {BigNumber} from '@ethersproject/bignumber'
import {Token, TokenAmount} from '@jediswap/sdk'
import {uint256} from 'starknet'
import {getTokenContract} from "../protocols/jediswap/contracts";
import {StarknetConnector} from "../utils/constants/interfaces";
// import { useSingleCallResult } from '../state/multicall/hooks'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export async function getTotalSupply(token: Token, starknetConnector: StarknetConnector): Promise<TokenAmount | undefined> {
  const contract = getTokenContract(token.address, starknetConnector)

  // const totalSupply = useSingleCallResult(contract, 'totalSupply')?.result?.[0]
  const totalSupply = (await contract.call('totalSupply'))[0]
  return totalSupply;
  // const totalSupply = useStarknetCall(contract, 'totalSupply')?.totalSupply

  return token && totalSupply ? new TokenAmount(token, totalSupply.toString()) : undefined
}
