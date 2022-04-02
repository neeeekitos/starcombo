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
      const itemNumber = Object.keys(transaction)[0]; // This is the item id.
      const [transactionCall] = Object.keys(Object.values(transaction)[0]);
      let appTransaction = get().transactionItems;
      appTransaction[itemNumber] = transactionCall;
      set((state) => ({...state, transactions: appTransaction}));
    }

}
));