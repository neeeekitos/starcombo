import create from "zustand";
import {AccountInterface, Provider} from "starknet";
import {useCallback} from "react";

interface AmountsState {
  appItems: {
    [key: number]: { [key: string]: number }
  },
  initialFunds: {
    [key: string]: number
  }
  receivedFunds: {
    [key: string]: number
  }
  addItem: (item: { [key: number]: { [key: string]: number } }) => void,
}

export const useAmounts = create<AmountsState>((set, get) => ({
    appItems: {},
    initialFunds: {},
    receivedFunds: {},
    addItem: (item: { [key: number]: { [key: string]: number } }) => {
      //First we store this item inside the item structure.
      const itemNumber = Object.keys(item)[0]; // This is the item id.
      const [itemAssetFrom, itemAssetTo] = Object.keys(Object.values(item)[0]);
      const [itemValueFrom, itemValueTo] = Object.values(Object.values(item)[0]);
      let appItems = get().appItems;
      appItems[itemNumber] = {[itemAssetFrom]: itemValueFrom, [itemAssetTo]: itemValueTo}
      set((state) => ({...state, appItems: appItems}));

      //Then we compute initial and received funds !

      let initialFunds = {};
      let receivedFunds = {};

      for (const action of Object.values(appItems)) {
        const [assetFrom, assetTo] = Object.keys(action);
        const [amountFrom, amountTo] = Object.values(action);

        //Calculations
        const outputValue = receivedFunds[assetFrom];

        //Token From

        // 2 cases : if this input is an output from another card, we need to compute how much of it is the result of the
        // previous operation and how much is new capital brought to the app
        if (outputValue === undefined) {
          //it's not a previous output, so it's an initial fund
          initialFunds[assetFrom] = initialFunds[assetFrom] ? initialFunds[assetFrom] + amountFrom : amountFrom;
        } else {
          //it's a previous output value. So we need to find how much the users needs to bring.
          const usedFromPreviousOutput = outputValue - amountFrom;
          if (usedFromPreviousOutput < 0) {
            //We need to bring new funds and remove the funds from the outputs
            initialFunds[assetFrom] = initialFunds[assetFrom] ? initialFunds[assetFrom] + Math.abs(usedFromPreviousOutput) : Math.abs(usedFromPreviousOutput);
            receivedFunds[assetFrom] = 0;
          } else {
            //No need to deploy new capital.
            receivedFunds[assetFrom] = usedFromPreviousOutput;
          }
        }

        //Token To
        receivedFunds[assetTo] = receivedFunds[assetTo] ? receivedFunds[assetTo] + amountTo : amountTo;

      }
      console.log(initialFunds, receivedFunds)
      set((state) => ({...state, initialFunds: initialFunds}))
      set((state) => ({...state, receivedFunds: receivedFunds}))


    }
  }))
;