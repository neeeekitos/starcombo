import create from "zustand";
import {AccountInterface, Provider} from "starknet";
import {useCallback} from "react";
import {ACTIONS, ActionTypes} from "../utils/constants/constants";

interface ItemProps {
  [key: number]: ItemAction
}

interface ItemAction {
  actionType: string,
  tokens: {
    [key: string]: number | string //key should be token address
  }
}

interface AmountsState {
  appItems: ItemProps,
  initialFunds: {
    [key: string]: number
  }
  receivedFunds: {
    [key: string]: number
  }
  addItem: (item: ItemProps) => void,
  addAddLiquidityItem: (item: ItemProps) => void,
  addRemoveLiquidityItem: (item: ItemProps) => void,
}

interface ActionOptions {
  [key: string]: any
}

const handleSwap = (initialFunds, receivedFunds, tokens) => {
  const [assetFrom, assetTo] = Object.keys(tokens);
  const [amountFrom, amountTo] = Object.values(tokens);

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

  return [initialFunds, receivedFunds];

}

const handleAddLiquidity = (tokens) => {

}
const handleRemoveLiquidity = (tokens) => {

}

const calculateFunds = (appItems) => {
  //Then we compute initial and received funds !
  let initialFunds = {};
  let receivedFunds = {};

  const actions: ActionOptions[] = Object.values(appItems);
  for (const action of actions) {
    let handleAction: ActionOptions = {
      [ACTIONS[ActionTypes.SWAP].name]: handleSwap,
      [ACTIONS[ActionTypes.ADD_LIQUIDITY].name]: handleAddLiquidity,
      [ACTIONS[ActionTypes.REMOVE_LIQUIDITY].name]: handleRemoveLiquidity,
    }
    handleAction[action.actionType](initialFunds, receivedFunds, action.tokens);
  }
  return [initialFunds,receivedFunds]
}

export const useAmounts = create<AmountsState>((set, get) => ({
    appItems: {},
    initialFunds: {},
    receivedFunds: {},
    addItem: (item) => {
      //First we store this item inside the item structure.
      const itemNumber = Object.keys(item)[0]; // This is the item id.
      const {actionType, tokens} = item[itemNumber];
      const [itemAssetFrom, itemAssetTo] = Object.keys(tokens);
      const [itemValueFrom, itemValueTo] = Object.values(tokens);
      let appItems = get().appItems;
      appItems[itemNumber] = {
        actionType: actionType,
        tokens: {
          [itemAssetFrom]: itemValueFrom, [itemAssetTo]: itemValueTo,
        }
      }
      set((state) => ({...state, appItems: appItems}));
      // set((state) => ({...state, initialFunds: initialFunds}))
      //   set((state) => ({...state, receivedFunds: receivedFunds}))
      const [initialFunds, receivedFunds] = calculateFunds(appItems)
      console.log(initialFunds,receivedFunds)


    },
    addAddLiquidityItem: (item) => {
      const itemNumber = Object.keys(item)[0]; // This is the item id.
      const [itemTokenFrom, itemTokenTo] = Object.keys(Object.values(item)[0]);
      const [itemAmountFrom, itemAmountTo] = Object.values(Object.values(item)[0]);
      let appItems = get().appItems;
      appItems[itemNumber] = {
        type: "addLiquidity",
        [itemTokenFrom]: itemAmountFrom, [itemTokenTo]: itemAmountTo
      }
      set((state) => ({...state, appItems: appItems}));

    },
    addRemoveLiquidityItem: (item) => {
      const itemNumber = Object.keys(item)[0]; // This is the item id.
      const [itemTokenFrom, itemTokenTo] = Object.keys(Object.values(item)[0]);
      const [itemAmountFrom, itemAmountTo] = Object.values(Object.values(item)[0]);
      let appItems = get().appItems;
      appItems[itemNumber] = {
        type: "removeLiquidity",
        [itemTokenFrom]: itemAmountFrom, [itemTokenTo]: itemAmountTo
      }
      set((state) => ({...state, appItems: appItems}));
    }

  }))
;