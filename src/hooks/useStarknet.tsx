import create from "zustand";
import {AccountInterface, Provider} from "starknet";
import {getStarknet, disconnect} from "get-starknet";

interface StarknetState {
  account: AccountInterface | undefined,
  provider: Provider | undefined,
  setAccount: (account: AccountInterface) => void,
  setProvider: (provider: Provider) => void,
  connectWallet: () => Promise<string|undefined>
  disconnect: () => void
}

const GOERLI_CHAIN_ID = "0x534e5f474f45524c49";
export const useStarknet = create<StarknetState>((set) => ({
    account: undefined,
    provider: undefined,
    setAccount: (account: AccountInterface) => {
      set((state) => ({...state, account: account}))
    },
    setProvider: (provider: Provider) => {
      set((state) => ({...state, provider: provider}))
    },
    connectWallet: async () => {
      console.log('connecting')
      const starknet = getStarknet();
      console.log(starknet)
      await starknet.enable({showModal:true});
      console.log(starknet)
      if(starknet.account.address==='' || !starknet.isConnected) return('Connection failed')
      // @ts-ignore
      if(starknet.account.chainId!==GOERLI_CHAIN_ID) return('Wrong chain. Use your Goerli testnet account.')
      set((state) => ({...state, account: starknet.account, provider: starknet.provider}))
    },
    disconnect: () => {
      disconnect();
      set((state) => ({account: undefined, provider: undefined}))
    },
  })
)
