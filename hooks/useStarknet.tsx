import create from "zustand";
import {AccountInterface, Provider} from "starknet";
import {getStarknet} from "@argent/get-starknet/dist";

interface StarknetState {
  account: AccountInterface | undefined,
  provider: Provider | undefined,
  setAccount: (account: AccountInterface) => void,
  setProvider: (provider: Provider) => void,
  connectWallet: () => void,
  disconnect: () => void
}

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
      const starknet = getStarknet();
      await starknet.enable();
      set((state) => ({...state, account: starknet.account, provider: starknet.provider}))

    },
    disconnect: () => {
      set((state) => ({account: undefined, provider: undefined}))
    },
  })
)
