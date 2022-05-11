import create from "zustand";
import {Call, Provider} from "starknet";
import {Status} from "starknet/src/types/lib";

interface TransactionItem {
  [key: number]: Call | Call[]
}

interface SentTransactions {
  tx_hash: string,
  status: Status,
  failureReason?:{
    message:string,
    code:string
  }
}

interface TransactionState {
  transactionItems: TransactionItem, //mapping item id => Call
  transactionHistory: SentTransactions[],
  orderedItemsIds: any[],
  orderedTransactionData: any[],
  addTransaction: (transaction: TransactionItem) => void,
  addTransactionHistory: (hash: string) => void,
  updateTransactionStatus: (provider: Provider) => void,
  removeTransaction: (itemNumber: number) => void,
  reorderTransactions: (newOrder: any[]) => void,

}

const getOrderedTransactions = (transactionItems, itemsIdOrder) => {
  itemsIdOrder.map((item: TransactionItem) => {
    return item
  })
}

export const useTransactions = create<TransactionState>((set, get) => ({
    transactionItems: {},
    transactionHistory: [],
    orderedItemsIds: [],
    orderedTransactionData: [],
    addTransaction: (transaction) => {
      //When adding a transaction :
      // 1 - Add its id and data to the mapping
      // 2 - re-compute ordered transaction array

      //set the itemId=>data
      const itemNumber = Object.keys(transaction)[0]; // This is the item id.
      const transactionCalls = Object.values(transaction)[0]
      let transactionItems = get().transactionItems;
      transactionItems[itemNumber] = transactionCalls;
      set((state) => ({...state, transactions: transactionItems}));

      //re-compute transaction array
      let itemsOrder = get().orderedItemsIds;
      const newTransactionOrder = itemsOrder.flatMap((item) => {
        if (!transactionItems[item.id]) return [];
        return transactionItems[item.id]
      })
      set((state) => ({...state, orderedTransactionData: newTransactionOrder})); //JS objects passed by ref so make a copy :)


      //TODO useless

      // if (!isItemOrdered) {
      //   set((state) => ({...state, orderedTransactionData: [...state.orderedTransactionData, appTransaction[itemNumber]]}));
      //
      //   //Also we need to push it to the end of orderedItemIds
      //   set((state) => ({...state, itemsIdOrder: [...state.orderedItemsIds, itemNumber]}));
      // }




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
        const updatedResponse = (await provider.getTransactionStatus(transaction.tx_hash))
        const updatedStatus = updatedResponse.tx_status
        let failureReason;
        if(updatedResponse.tx_failure_reason) failureReason = {
          message: updatedResponse.tx_failure_reason?.error_message,
          code: updatedResponse.tx_failure_reason?.code
        }
        transaction.status = updatedStatus
        transaction.failureReason = failureReason
        console.log(transaction);
      }));
      set((state) => ({...state, transactionHistory: transactionHistory}));
    },
    removeTransaction: (itemNumber) => {
      //When removing transaction :
      // 1 - Remove key from mapping id => transaction
      // 2 - Remove entry from ordered item array
      // 3 - re-compute ordered transaction array

      //delete entry
      let transactionItems = get().transactionItems;
      delete transactionItems[itemNumber];

      //delete item from order array
      let itemsOrder = get().orderedItemsIds;
      itemsOrder = itemsOrder.filter((item) => item.id !== itemNumber)

      //re-compute transaction array
      const newTransactionOrder = itemsOrder.flatMap((item) => {
        if (!transactionItems[item.id]) return [];
        return transactionItems[item.id]
      })

      set((state) => ({...state, orderedTransactionData: newTransactionOrder})); //JS objects passed by ref so make a copy :)
      set((state) => ({...state, transactionItems: transactionItems}));
      set((state) => ({...state, itemsOrder: itemsOrder}));
    },
    reorderTransactions: (newOrder) => {
      //When reordering items :
      // 1 - Re-compute ordered transaction array
      // 2 - set new ordered items array

      //On reorder : reorder itemIds and transactiondata
      let transactionItems = get().transactionItems;
      const newTransactionOrder = newOrder.flatMap((item) => {
        if (!transactionItems[item.id]) return [];
        return transactionItems[item.id]
      })
      console.log(newTransactionOrder)
      set((state) => ({...state, orderedItemsIds: [...newOrder]})); //JS objects passed by ref so make a copy :)
      set((state) => ({...state, orderedTransactionData: newTransactionOrder}));

    }


  }
));