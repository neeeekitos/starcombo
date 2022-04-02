import create from "zustand";
import {Call} from "starknet";

interface TransactionItem {
  [key: number]: Call | Call[]
}

interface TransactionState {
  transactionItems: TransactionItem, //mapping item id => Call
  addTransaction: (transaction: TransactionItem) => void,
}

export const useTransactions = create<TransactionState>((set, get) => ({
    transactionItems:{},
    addTransaction: (transaction) =>{
      console.log(transaction)
      const itemNumber = Object.keys(transaction)[0]; // This is the item id.
      console.log(Object.values(transaction));
      const transactionCalls = Object.values(transaction)[0]
      console.log(transactionCalls)
      let appTransaction = get().transactionItems;
      appTransaction[itemNumber] = transactionCalls;
      set((state) => ({...state, transactions: appTransaction}));
    }

}
));