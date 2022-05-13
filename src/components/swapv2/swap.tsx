import React, {ChangeEvent, useEffect, useRef, useState} from "react";

import {PROTOCOLS} from "../../utils/constants/constants";

import {Box, Flex} from "@chakra-ui/react";
import useComponentVisible from "../../hooks/UseComponentVisible";
import {useAmounts} from "../../hooks/useAmounts";
import {useStarknet} from "../../hooks/useStarknet";
import {DexCombo, StarknetConnector, SwapParameters} from "../../utils/constants/interfaces";
import {getBalanceOfErc20, getFloatFromBN} from "../../utils/helpers";
import {Pair, Token} from "@jediswap/sdk";
import {useTransactions} from "../../hooks/useTransactions";
import {NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import SwapField from "./SwapField";
import {ArrowDownIcon} from "@chakra-ui/icons";
import BlockHeader from "../BlockHeader";
import BlockFooter from "../BlockFooter";
import LockedSwapInput from "./LockedSwapInput";

interface ActionBlockProps {
  actionName: string,
  protocolName: string,
  action: any,
  handleRemoveAction: (actionId: number) => void,
  moved?: any
}

interface ExecutionPrices {
  priceAtoB: number,
  priceBtoA: number
}

const Swap = (props: ActionBlockProps) => {
  //custom hooks
  const {account, provider} = useStarknet();
  const starknetConnector: StarknetConnector = {
    account: account,
    provider: provider
  }
  const {addItem, addToken, removeItem} = useAmounts();
  const {addTransaction, removeTransaction} = useTransactions();
  const {
    tokens: protocolTokens,
    instance: protocolInstance
  }: { tokens: any, instance: DexCombo } = PROTOCOLS[props.action.protocolName];
  const {ref, isComponentVisible, setIsComponentVisible} =
    useComponentVisible(false);


  //States//

  //token amounts
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");

  //token addresses
  const [tokenFromSelector, setTokenFromSelector] = useState<Token>(protocolTokens[0]);
  const [tokenToSelector, setTokenToSelector] = useState<Token>(protocolTokens[1]);
  const [tokenFromBalance, setTokenFromBalance] = useState<number>();
  const [tokenToBalance, setTokenToBalance] = useState<number>();

  // LP pair
  const [pair, setPair] = useState<Pair>();
  const [prices, setPrices] = useState<ExecutionPrices>();

  //poolId required to use with mySwap
  const [poolId, setPoolId] = useState<string>();

  //Token objects with decimals
  const [tokenFrom, setTokenFrom] = useState<Token>();
  const [tokenTo, setTokenTo] = useState<Token>();

  //When loading route
  const [loading, setLoading] = useState<boolean>(false);

  //If the component has been set by the user
  const [set, setSet] = useState<boolean>(false)
  const [disabled, setDisabled] = useState<boolean>(true);


  //REFS//
  const outsideSetButton = useRef(null);

  //When changing tokens in swap component
  useEffect(() => {

    //Reset states
    setPrices({priceAtoB: 0, priceBtoA: 0})
    setAmountFrom('0')
    setAmountTo('0')
    unsetItem();

    //Fetch pool pair
    const fetchPair = async () => {
      //TODO clean this properly, for example use custom hooks :)
      setLoading(true);
      const [tokenFrom, tokenTo] = [tokenFromSelector, tokenToSelector];

      //TODO add support for custom tokens here (user only inputs address and data is fetched)
      //For now, tokenFromSelector = tokenFrom because we're using hardcoded values.
      // It avoids us to re-query the same thing multiple times

      // const {tokenFrom, tokenTo} =
      //   await createTokenObjects(starknetConnector, tokenFromSelector.address, tokenToSelector.address);
      // console.log(tokenFrom,tokenTo);

      const [tokenFromBalanceBN, tokenToBalanceBN] = await Promise.all([getBalanceOfErc20(starknetConnector, tokenFromSelector), getBalanceOfErc20(starknetConnector, tokenToSelector)]);

      setTokenFromBalance(getFloatFromBN(tokenFromBalanceBN.toString(), tokenFromSelector.decimals));
      setTokenToBalance(getFloatFromBN(tokenToBalanceBN.toString(), tokenToSelector.decimals));

      setTokenFrom(tokenFrom);
      setTokenTo(tokenTo);
      const poolDetails = await protocolInstance.getPoolDetails(tokenFrom, tokenTo, provider);
      if (!poolDetails) {
        NotificationManager.error("No pool found");
        return;
      }

      const poolPair: Pair = poolDetails.poolPair;
      if (poolDetails.poolId) setPoolId(poolDetails.poolId)
      setPair(poolPair);
      //get execution prices when interacting with pool
      const swapParameters: SwapParameters = {
        tokenFrom: tokenFrom,
        tokenTo: tokenTo,
        amountIn: '1',
        amountOut: "0", //TODO support for this
        poolPair: poolPair,
      }
      const {execPrice} = await protocolInstance.getSwapExecutionPrice(starknetConnector, swapParameters);
      const priceAtoB = execPrice;
      const priceBtoA = 1 / execPrice;
      setPrices({priceAtoB: priceAtoB, priceBtoA: priceBtoA})

      setLoading(false);
    }
    fetchPair();

  }, [tokenFromSelector, tokenToSelector])

  /**
   * When the pair changes, unlock the item (remove it from current transaction)
   * And calculate new quote amount for given input
   */
  useEffect(() => {
    unsetItem();
    if (!pair) return;
    let value = amountFrom;
    let direction = "to"
    if (isNaN(parseFloat(value))) {
      value = amountTo;
      direction = "from";
    }
    setQuoteTokenAmount(value, direction)
  }, [pair, loading])

  useEffect(() => {
    setDisabled(isNaN(parseFloat(amountFrom)) || isNaN(parseFloat(amountTo)))
  }, [amountFrom, amountTo])

  /**
   * Removes the item from the set Items.
   */
  const unsetItem = () => {
    if (set) {
      setSet(false);
      removeItem(props.action.id);
      removeTransaction(props.action.id)
    }
  }

  //User input inside amount from
  const handleAmountFrom = (value) => {
    setAmountFrom(value);
    if (!pair) return;
    setQuoteTokenAmount(value, "to")
  }

  //User input inside amount to
  const handleAmountTo = (value) => {
    setAmountTo(value);
    if (!pair) return;
    setQuoteTokenAmount(value, "from")
  }

  //Calculates the amount of quote token for user's input
  const setQuoteTokenAmount = async (value, priceWanted) => {
    if (value === '') value = '0'
    if (isNaN(value as any) || !pair) return;

    if (priceWanted === "from") {
      //If input is null => output is null, don't get exec price
      if(parseFloat(value)===0) {
        setAmountFrom('0')
        return
      }

      const swapParameters: SwapParameters = {
        tokenFrom: tokenFrom,
        tokenTo: tokenTo,
        amountIn: "0",
        amountOut: value, //TODO support for this
        poolPair: pair,
      }
      console.log(swapParameters)
      const {execPrice} = await protocolInstance.getSwapExecutionPrice(starknetConnector, swapParameters);
      const amountFrom = value * execPrice
      setAmountFrom(amountFrom.toString())
    } else {
      if(parseFloat(value)===0) {
        setAmountTo('0')
        return
      }
      // to
      const swapParameters: SwapParameters = {
        tokenFrom: tokenFrom,
        tokenTo: tokenTo,
        amountIn: value,
        amountOut: "0", //TODO support for this
        poolPair: pair,
      }
      console.log(swapParameters)
      const {execPrice} = await protocolInstance.getSwapExecutionPrice(starknetConnector, swapParameters);
      const amountTo = value * execPrice
      setAmountTo(amountTo.toString())
    }
  }

  //Inverts token from and token to in component
  const switchTokens = () => {
    unsetItem();
    const tempFrom = tokenFromSelector;
    const tempAmtFrom = amountFrom;
    setTokenFromSelector(tokenToSelector);
    setTokenToSelector(tempFrom);
    setAmountFrom(amountTo);
    setAmountTo(tempAmtFrom);
  }

  //Sets the action, meaning that it will be executed when the user clicks on 'send'
  const setAction = async () => {

    const swapParameters: SwapParameters = {
      tokenFrom: tokenFrom,
      tokenTo: tokenTo,
      amountIn: amountFrom,
      amountOut: "0", //TODO support for this
      poolPair: pair,
      poolId: poolId
    }

    if (amountFrom === '0') {
      NotificationManager.error("Can't swap a null amount");
      return;
    }

    //We need details to know the minimum amount the user will receive
    const {call, details} = await protocolInstance.swap(starknetConnector, swapParameters)

    //Add item to the recap DS
    addItem({
      [props.action.id]: {
        actionType: props.actionName,
        tokens: {
          [tokenFromSelector.name]: parseFloat(amountFrom),
          [tokenToSelector.name]: parseFloat(amountTo)
        }
      }
    });
    addToken(tokenFromSelector.name, tokenFrom);
    addToken(tokenToSelector.name, tokenTo);
    //Add call to the transactions DS.
    addTransaction({
      [props.action.id]: call
    })
    setIsComponentVisible(false)
    setSet(true);
  }

  const renderUnset = () =>{
    return (
      <Flex padding={'10px'} width={'450px'} borderRadius={'15px'} backgroundColor={'#201E2C'} flexDir={'column'}>
        <BlockHeader type={'Swap  '} protocolName={props.protocolName}
                     handleRemoveAction={props.handleRemoveAction} action={props.action} set={set}
                     unsetItem={unsetItem}/>
        <Flex padding='10px' marginTop='10px' marginBottom={'10px'} flexDir={'column'} flexWrap={'wrap'}
              alignItems={'center'}>
          <SwapField fieldType={'from'} amount={amountFrom} balance={tokenFromBalance} handleAmount={handleAmountFrom}
                     selectedToken={tokenFrom}
                     tokenSelector={tokenFromSelector} setTokenSelector={setTokenFromSelector}
                     protocolTokens={protocolTokens} quoteTokenSelector={tokenToSelector}/>
          <Box marginY={'5px'}>
            <ArrowDownIcon
              cursor={'pointer'}
              onClick={switchTokens}/>
          </Box>
          <SwapField fieldType={'to'} amount={amountTo} balance={tokenToBalance} handleAmount={handleAmountTo}
                     selectedToken={tokenTo}
                     tokenSelector={tokenToSelector} setTokenSelector={setTokenToSelector}
                     protocolTokens={protocolTokens}
                     quoteTokenSelector={tokenFromSelector}/>
        </Flex>
        <BlockFooter loading={loading} set={set} setAction={setAction} disabled={disabled}/>
      </Flex>
    )
  }

  const renderSet = () =>{
    return(
      <Flex padding={'10px'} width={'450px'} borderRadius={'15px'} backgroundColor={'#201E2C'} flexDir={'column'}>
        <BlockHeader type={'Swap'} protocolName={props.protocolName}
                     handleRemoveAction={props.handleRemoveAction} action={props.action} set={set}
                     unsetItem={unsetItem}/>
        <Flex padding='5px' marginTop='5px' marginBottom={'5px'} flexDir={'column'} flexWrap={'wrap'}
              alignItems={'center'}>
          <LockedSwapInput amount={amountFrom} selectedToken={tokenFrom}/>
          <Box marginTop={'2px'}>
            <ArrowDownIcon/>
          </Box>
          <LockedSwapInput amount={amountTo} selectedToken={tokenTo}/>
        </Flex>
      </Flex>
    )
  }

  return (
    <>
      {!set && renderUnset()}

      {set && renderSet()}

    </>
  )
}


export default Swap;
