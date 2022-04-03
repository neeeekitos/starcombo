import create from "zustand";
import {AccountInterface, Provider} from "starknet";
import {useCallback} from "react";
import {ACTIONS, ActionTypes} from "../utils/constants/constants";
import {Token} from "@jediswap/sdk";

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
  },
  tokenInfos: {
    [key: string]: Token
  },
  addItem: (item: ItemProps) => void,
  addToken:(address:string, token:Token)=>void,
}

interface ActionOptions {
  [key: string]: any
}

const balanceChangesTokenFrom = (initialFunds, receivedFunds, tokenFrom, amountFrom) => {
  //Calculations
  const outputValue = receivedFunds[tokenFrom];

  //Token From
  // 2 cases : if this input is an output from another card, we need to compute how much of it is the result of the
  // previous operation and how much is new capital brought to the app
  if (outputValue === undefined) {
    //it's not a previous output, so it's an initial fund
    initialFunds[tokenFrom] = initialFunds[tokenFrom] ? initialFunds[tokenFrom] + amountFrom : amountFrom;
  } else {
    //it's a previous output value. So we need to find how much new capital the users needs to bring.
    const usedFromPreviousOutput = outputValue - amountFrom;
    if (usedFromPreviousOutput < 0) {
      //We need to bring new funds and remove the funds from the outputs
      initialFunds[tokenFrom] = initialFunds[tokenFrom] ? initialFunds[tokenFrom] + Math.abs(usedFromPreviousOutput) : Math.abs(usedFromPreviousOutput);
      delete receivedFunds[tokenFrom];
    } else {
      //No need to deploy new capital.
      receivedFunds[tokenFrom] = usedFromPreviousOutput;
      if (usedFromPreviousOutput === 0) delete receivedFunds[tokenFrom]
    }
  }
  return [initialFunds, receivedFunds];
}

const balanceChangeTokenTo = (receivedFunds, tokenTo, amountTo) => {
  //Token To
  receivedFunds[tokenTo] = receivedFunds[tokenTo] ? receivedFunds[tokenTo] + amountTo : amountTo;
  return receivedFunds;
}

const handleSwap = (initialFunds, receivedFunds, tokens) => {
  const [tokenFrom, tokenTo] = Object.keys(tokens);
  const [amountFrom, amountTo] = Object.values(tokens);
  //We trade tokenFrom to get TokenTo
  [initialFunds, receivedFunds] = balanceChangesTokenFrom(initialFunds, receivedFunds, tokenFrom, amountFrom);
  receivedFunds = balanceChangeTokenTo(receivedFunds, tokenTo, amountTo);
  return [initialFunds, receivedFunds];

}

const handleAddLiquidity = (initialFunds, receivedFunds, tokens) => {
  const [token0, token1] = Object.keys(tokens);
  const [amount0, amount1] = Object.values(tokens);
  //We trade token0 and token1 to get LP tokens
  [initialFunds, receivedFunds] = balanceChangesTokenFrom(initialFunds, receivedFunds, token0, amount0);
  [initialFunds, receivedFunds] = balanceChangesTokenFrom(initialFunds, receivedFunds, token1, amount1);
  // receivedFunds = balanceChangeTokenTo(receivedFunds, tokenReceived, amountReceived);
  return [initialFunds, receivedFunds];


}
const handleRemoveLiquidity = (initialFunds, receivedFunds, tokens) => {
  const [tokenReceived0, tokenReceived1] = Object.keys(tokens);
  const [amountReceived0, amountReceived1] = Object.values(tokens);
  //We trade LP token for token0 and token1
  // [initialFunds, receivedFunds] = balanceChangesTokenFrom(initialFunds, receivedFunds, token0, amount0);
  receivedFunds = balanceChangeTokenTo(receivedFunds, tokenReceived0, amountReceived0);
  receivedFunds = balanceChangeTokenTo(receivedFunds, tokenReceived1, amountReceived1);
  return [initialFunds, receivedFunds];
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
  return [initialFunds, receivedFunds]
}

export const useAmounts = create<AmountsState>((set, get) => ({
    appItems: {},
    initialFunds: {},
    receivedFunds: {},
    tokenInfos: {},
    addItem: (item) => {
      //First we store this item inside the item structure.
      const itemNumber = Object.keys(item)[0]; // This is the item id.
      const {actionType, tokens} = item[itemNumber];
      const [itemTokenFrom, itemTokenTo] = Object.keys(tokens);
      const [itemValueFrom, itemValueTo] = Object.values(tokens);
      let appItems = get().appItems;
      appItems[itemNumber] = {
        actionType: actionType,
        tokens: {
          [itemTokenFrom]: itemValueFrom, [itemTokenTo]: itemValueTo,
        }
      }
      set((state) => ({...state, appItems: appItems}));
      const [initialFunds, receivedFunds] = calculateFunds(appItems)
      set((state) => ({...state, initialFunds: initialFunds}));
      set((state) => ({...state, receivedFunds: receivedFunds}));
    },
  addToken:(address,token) =>{
    let tokenInfos = get().tokenInfos;
    tokenInfos[address] = token
    set((state) => ({...state, tokenInfos: tokenInfos}));
  }

  }))
;
