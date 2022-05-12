import create from "zustand";
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
  itemsIdOrder: any[],
  addItem: (item: ItemProps) => void,
  addToken: (address: string, token: Token) => void,
  removeItem: (itemId: number) => void,
  reorderAmounts: (newOrder: any[]) => void,

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

  const handleAction: ActionOptions = {
    [ACTIONS[ActionTypes.SWAP].name]: handleSwap,
    [ACTIONS[ActionTypes.ADD_LIQUIDITY].name]: handleAddLiquidity,
    [ACTIONS[ActionTypes.REMOVE_LIQUIDITY].name]: handleRemoveLiquidity,
  }

  for (const action of actions) {
    handleAction[action.actionType](initialFunds, receivedFunds, action.tokens);
  }
  return [initialFunds, receivedFunds]
}

const testCalc = (actions: ActionOptions[]) => {
  let initialFunds = {};
  let receivedFunds = {};
  const handleAction: ActionOptions = {
    [ACTIONS[ActionTypes.SWAP].name]: handleSwap,
    [ACTIONS[ActionTypes.ADD_LIQUIDITY].name]: handleAddLiquidity,
    [ACTIONS[ActionTypes.REMOVE_LIQUIDITY].name]: handleRemoveLiquidity,
  }

  for (const action of actions) {
    handleAction[action.actionType](initialFunds, receivedFunds, action.tokens);
  }
  return [initialFunds, receivedFunds]
}


export const useAmounts = create<AmountsState>((set, get) => ({
  appItems: {},
  initialFunds: {},
  receivedFunds: {},
  tokenInfos: {},
  itemsIdOrder: [], //array of block ids
  addItem: (item) => {
    //When adding an item  :
    // 1 - Add its id and data to the mapping
    // 2 - re-compute funds from re-ordered array

    //First we store this item inside the item structure. It's a simple mapping id=>item props
    //That allows us to quickly edit/delete items.
    const itemNumber = Object.keys(item)[0]; // This is the item id.
    const {actionType, tokens} = item[itemNumber];
    const [itemTokenFrom, itemTokenTo] = Object.keys(tokens);
    const [itemValueFrom, itemValueTo] = Object.values(tokens);
    let appItems = get().appItems;
    appItems[itemNumber] = {
      id: itemNumber,
      actionType: actionType,
      tokens: {
        [itemTokenFrom]: itemValueFrom, [itemTokenTo]: itemValueTo,
      }
    }

    //To calculate the funds received and provided, we need to keep in mind the order of the items.
    //So we have to get the orderedItemsIds in our app and create an array that is in the correct order from our appItems DS.

    //Get the items id order array and try to find this item. If it's there, no updates to do. Otherwise push it to the end.
    let itemsIdOrder = get().itemsIdOrder;
    //this is actually useless cause it is always ordered the right way
    // const isItemOrdered = itemsIdOrder.find((elem)=>elem.id===itemNumber)
    // console.log(itemsIdOrder)
    // if(!isItemOrdered){
    //   itemsIdOrder.push(appItems[itemNumber]);
    //   set((state) => ({...state, itemsIdOrder: [...state.itemsIdOrder,appItems[itemNumber]]}));
    // }

    //calculate funds change
    const newItemsOrder = itemsIdOrder.flatMap((item) => {
      if(!appItems[item.id]) return [];
      return appItems[item.id]
    })
    const [initialFunds, receivedFunds] = testCalc(newItemsOrder);
    //set new states
    set((state) => ({...state, appItems: appItems}));
    set((state) => ({...state, initialFunds: initialFunds}));
    set((state) => ({...state, receivedFunds: receivedFunds}));
  },
  addToken: (address, token) => {
    let tokenInfos = get().tokenInfos;
    tokenInfos[address] = token
    set((state) => ({...state, tokenInfos: tokenInfos}));
  },
  removeItem: (itemNumber) => {
    //When removing item :
    // 1 - Remove key from mapping id => itemData
    // 2 - Remove entry from ordered item array
    // 3 - re-compute funds

    let appItems = get().appItems;
    delete appItems[itemNumber];

    let itemsOrder = get().itemsIdOrder;
    itemsOrder = itemsOrder.filter((item) => item.id !== itemNumber)

    const [initialFunds, receivedFunds] = calculateFunds(appItems)
    set((state) => ({...state, initialFunds: initialFunds}));
    set((state) => ({...state, receivedFunds: receivedFunds}));
    set((state) => ({...state, appItems: appItems}));
    set((state) => ({...state, itemsOrder: itemsOrder}));

  },
  reorderAmounts: (newOrder) => {
    //When reordering :
    // 1 - Re-compute new itemsData ordered
    // 2 - set new ordered items array
    // 3 - compute new funds
    let appItems = get().appItems;
    const newItemsOrder = newOrder.flatMap((item) => {
      if(!appItems[item.id]) return [];
      return appItems[item.id]
    })
    set((state) => ({...state, itemsIdOrder: [...newOrder]})); //JS objects passed by ref so make a copy :)
    const [initialFunds, receivedFunds] = testCalc(newItemsOrder)
    set((state) => ({...state, initialFunds: initialFunds}));
    set((state) => ({...state, receivedFunds: receivedFunds}));
  }

}));
