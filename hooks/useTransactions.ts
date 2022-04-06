import create from "zustand";
import {Call, Provider} from "starknet";
import {Status} from "starknet/src/types/lib";

interface TransactionItem {
  [key: number]: Call | Call[]
}

interface SentTransactions {
  tx_hash: string,
  status: Status,
}

interface TransactionState {
  transactionItems: TransactionItem, //mapping item id => Call
  transactionHistory: SentTransactions[],
  addTransaction: (transaction: TransactionItem) => void,
  addTransactionHistory: (hash: string) => void,
  updateTransactionStatus: (provider: Provider) => void,
  removeTransaction:(itemNumber:number)=>void,

}

export const useTransactions = create<TransactionState>((set, get) => ({
    transactionItems: {},
    transactionHistory: [],
    addTransaction: (transaction) => {
      const itemNumber = Object.keys(transaction)[0]; // This is the item id.
      const transactionCalls = Object.values(transaction)[0]
      let appTransaction = get().transactionItems;
      appTransaction[itemNumber] = transactionCalls;
      set((state) => ({...state, transactions: appTransaction}));
    },
    addTransactionHistory: (hash) => {
      set((state) => ({
        ...state,
        transactionHistory: [...state.transactionHistory, {tx_hash: hash, status: 'RECEIVED'}]
      }));
    },
    updateTransactionStatus: async (provider) => {
      let transactionHistory = get().transactionHistory;
      await Promise.all(transactionHistory.map(async (transaction) => {
        const updatedStatus = (await provider.getTransactionStatus(transaction.tx_hash)).tx_status
        transaction.status = updatedStatus
        console.log(updatedStatus,transaction.status)
      }));
      set((state) => ({...state, transactionHistory: transactionHistory }));
    },
    removeTransaction:(itemNumber)=>{
      let appTransaction = get().transactionItems;
      delete appTransaction[itemNumber];
      set((state) => ({...state, appItems: appTransaction}));
    }


  }
));