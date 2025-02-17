import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import useComponentVisible from "../../hooks/UseComponentVisible";
import {Box, Flex} from "@chakra-ui/react";
import {PROTOCOLS, SLIPPAGE} from "../../utils/constants/constants";
import {useStarknet} from "../../hooks/useStarknet";
import {DexCombo, StarknetConnector, SwapParameters} from "../../utils/constants/interfaces";
import {useAmounts} from "../../hooks/useAmounts";
import {useTransactions} from "../../hooks/useTransactions";
import {Pair, Price, Token, TokenAmount} from "@jediswap/sdk";
import {BigNumberish, ethers} from "ethers";
import BigNumber from "bignumber.js";
import AddField from "./AddField";
import {AddIcon, ArrowDownIcon} from "@chakra-ui/icons";
import BlockHeader from "../BlockHeader";
import BlockFooter from "../BlockFooter";
import LockedAddInput from "./LockedAddInput";
import {getBalanceOfErc20, getFloatFromBN} from "../../utils/helpers";


interface ActionBlockProps {
  actionName: string,
  protocolName: string,
  action: any,
  handleRemoveAction: (actionId: number) => void,
}

interface ExecutionPrices {
  priceAtoB: number,
  priceBtoA: number
}

const ActionBlockAdd = (props: ActionBlockProps) => {

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

  //states
  const [pair, setPair] = useState<Pair>();
  const [poolId, setPoolId] = useState<string>();
  const [token0, setToken0] = useState<Token>();
  const [token1, setToken1] = useState<Token>();
  const [loading, setLoading] = useState<boolean>(false);

  const [token0Selector, setToken0Selector] = useState(protocolTokens[0]);
  const [token1Selector, setToken1Selector] = useState(protocolTokens[1]);
  const [amountToken0, setAmountToken0] = useState("");
  const [amountToken1, setAmountToken1] = useState("");
  const [token0Balance, setToken0Balance] = useState<number>();
  const [token1Balance, setToken1Balance] = useState<number>();

  const [poolShare, setPoolShare] = useState<string>("0");
  const [lpAmount, setLpAmount] = useState<string>(); // lp token amount
  const [lpTokenSupply, setLpTokenSupply] = useState<string>();

  const [prices, setPrices] = useState<ExecutionPrices>();


  const [disabled, setDisabled] = useState<boolean>(true);

  const [estimation, setEstimation] = useState("");

  //If the component has been set by the user
  const [set, setSet] = useState<boolean>(false)

  //REFS//
  const outsideSetButton = useRef(null);

  const resetFetchedStates = () =>{
    setPrices(undefined);
    setPair(undefined);
    setPoolShare("");
    setToken0Balance(0);
    setToken1Balance(0);
  }


  //EFFECTS//

  /**
   * When changing one end of the pair, query the network to get pool details
   */
  useEffect(() => {
    unsetItem();
    const fetchPair = async () => {
      setLoading(true);
      const [token0, token1] = [token0Selector, token1Selector];
      setToken0(token0);
      setToken1(token1)
      const [token0BalanceBN, token1BalanceBN] = await Promise.all([getBalanceOfErc20(starknetConnector, token0Selector), getBalanceOfErc20(starknetConnector, token1Selector)]);

      setToken0Balance(getFloatFromBN(token0BalanceBN.toString(), token0Selector.decimals));
      setToken1Balance(getFloatFromBN(token1BalanceBN.toString(), token1Selector.decimals));

      const poolDetails = await protocolInstance.getPoolDetails(token0, token1, provider);
      const poolPair: Pair = poolDetails.poolPair;
      if (poolDetails.poolId) setPoolId(poolDetails.poolId)
      setPair(poolPair);

      //get prices in pool
      const swapParameters: SwapParameters = {
        tokenFrom: token0,
        tokenTo: token1,
        amountIn: '1',
        amountOut: "0", //TODO support for this
        poolPair: poolPair,
      }
      const {execPrice} = await protocolInstance.getSwapExecutionPrice(starknetConnector, swapParameters);
      const priceAtoB = execPrice;
      const priceBtoA = 1 / execPrice;
      setPrices({priceAtoB: priceAtoB, priceBtoA: priceBtoA})
      // console.log(poolPair)
      // const lpTokenSupply = await getTotalSupply(poolPair.liquidityToken,starknetConnector)
      // console.log(lpTokenSupply)
      // const strSupply =
      // setLpTokenSupply(strSupply);
      setLoading(false);
    }
    fetchPair();

  }, [token0Selector, token1Selector])

  /**
   * When the pair changes, unlock the item (remove it from current transaction)
   * And calculate new quote amount for given input
   */
  useEffect(() => {
    unsetItem();
    if (!pair /*|| lpTokenSupply*/) return;
    let value = amountToken0;
    let direction = "to"
    if (isNaN(value as any)) {
      value = amountToken1;
      direction = "from";
    }
    setQuoteTokenAmount(value, direction)
  }, [pair, loading])

  useEffect(() => {
    setDisabled(isNaN(parseFloat(amountToken0)) || isNaN(parseFloat(amountToken1)) || parseFloat(amountToken0)===0)
  }, [amountToken0, amountToken1])

  /**
   * When token0 amount changes, unset item and calculate token1 corresponding value
   * @param e
   */
  const handleAmountToken0 = (value) => {
    setAmountToken0(value)
    if (!pair) return;
    setQuoteTokenAmount(value, "to")
  }

  /**
   * When token1 amount changes, unset item and calculate token0 corres. value.
   * @param e
   */
  const handleAmountToken1 = (value) => {
    setAmountToken1(value)
    if (!pair) return;
    setQuoteTokenAmount(value, "from")
  }

  /**
   *
   * @param value input amount value
   * @param priceWanted price that we want ("from" for token0, "to" from token1).
   * eg. if we have an input for token0 we want token1
   */
  const setQuoteTokenAmount = (value, priceWanted) => {
    if (value === '') value = '0'
    if (isNaN(value as any)|| !pair ||!prices) return;

    let tokenFrom: Token, tokenTo: Token, tokenFromIsToken0, tokenFromPrice: Price, tokenToPrice: Price,
      reserveFrom: TokenAmount, reserveTo: TokenAmount;
    token0Selector.address === pair.token0.address ?
      [tokenFrom, tokenTo, tokenFromPrice, tokenToPrice, reserveFrom, reserveTo, tokenFromIsToken0] =
        [pair.token0, pair.token1, pair.token0Price, pair.token1Price, pair.reserve0, pair.reserve1, true] :
      [tokenFrom, tokenTo, tokenFromPrice, tokenToPrice, reserveFrom, reserveTo, tokenFromIsToken0] =
        [pair.token1, pair.token0, pair.token1Price, pair.token0Price, pair.reserve1, pair.reserve0, false];

    const [parsedReserveFrom, parsedReserveTo] =
      [
        ethers.utils.parseUnits(reserveFrom.toFixed(0), tokenFrom.decimals),
        ethers.utils.parseUnits(reserveTo.toFixed(), tokenTo.decimals)
      ]

    let BNPercent: BigNumber

    if (priceWanted === "from") {
      const amountFrom = value * prices.priceBtoA
      setAmountToken0(parseFloat(amountFrom.toPrecision(6)).toString())

      const parsedValue = ethers.utils.parseUnits(value, tokenTo.decimals)
      const BNvalue = new BigNumber(parsedValue.toString());
      BNPercent = BNvalue.div(BNvalue.plus(new BigNumber(parsedReserveTo.toString())))
    } else {
      // to
      const amountTo = value * prices.priceAtoB
      setAmountToken1(parseFloat(amountTo.toPrecision(6)).toString())

      const parsedValue = ethers.utils.parseUnits(value, tokenFrom.decimals)
      const BNvalue = new BigNumber(parsedValue.toString());
      BNPercent = BNvalue.div(BNvalue.plus(new BigNumber(parsedReserveFrom.toString())))
    }
    //TODO if time get how much lp tokens user gets
    // console.log(poolShareCalc.toFixed(4))
    // console.log(lpTokenSupply)
    // const lpamt = poolShareCalc.multiply(lpTokenSupply||'0').toFixed(4) || "0"
    //
    // console.log(pair.liquidityToken)
    // console.log(lpamt)
    // const fmtLpAmt = ethers.utils.formatUnits(lpamt,pair.liquidityToken.decimals).toString()
    // console.log(fmtLpAmt)
    // setLpAmount(fmtLpAmt)
    setPoolShare(BNPercent.multipliedBy(100).toFixed(6  ));
  }

  /**
   * Inverts two tokens
   */
  const switchTokens = () => {
    unsetItem();
    const newToken1 = token0Selector;
    setToken0Selector(token1Selector);
    setToken1Selector(newToken1);
    setPrices({priceAtoB: 0, priceBtoA: 0})
    setAmountToken1('0');
  }

  /**
   * Sets the action in state. calculates required data and builds the transaction calldata.
   */
  const setAction = async () => {
    //TODO depending on the props.actionName this should change because the tokens involved will not be the same.
    // So here it only works for swaps now. We need to integrate add and remove liq in the action blocks.
    addItem({
      [props.action.id]: {
        actionType: props.actionName,
        tokens: {
          [token0Selector.name]: parseFloat(amountToken0),
          [token1Selector.name]: parseFloat(amountToken1)
        }
      }
    });
    addToken(token0Selector.name, token0);
    addToken(token1Selector.name, token1);
    const tokenAmountFrom = new TokenAmount(token0, ethers.utils.parseUnits(amountToken0, token0.decimals).toString());
    const txLiq = await protocolInstance.addLiquidity(starknetConnector, pair, SLIPPAGE, tokenAmountFrom)

    addTransaction({
      [props.action.id]: txLiq.call
    })
    setIsComponentVisible(false);
    setSet(true);
  }

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

  const renderUnset = () => {
    return (
      <Flex padding={'10px'} width={'450px'} borderRadius={'15px'} backgroundColor={'#201E2C'} flexDir={'column'}>
        <BlockHeader type={'Add liquidity'} protocolName={props.protocolName}
                     handleRemoveAction={props.handleRemoveAction} action={props.action} set={set}
                     unsetItem={unsetItem}/>
        <Flex padding='10px' marginTop='10px' marginBottom={'10px'} flexDir={'column'} flexWrap={'wrap'}
              alignItems={'center'}>
          <AddField fieldType={'0'} balance={token0Balance} amount={amountToken0} handleAmount={handleAmountToken0}
                    selectedToken={token0} tokenSelector={token0Selector} setTokenSelector={setToken0Selector}
                    quoteTokenSelector={token1Selector} protocolTokens={protocolTokens}/>
          <Box marginY={'5px'}>
            <AddIcon
              cursor={'pointer'}
              onClick={switchTokens}/>
          </Box>
          <AddField fieldType={'1'} balance={token1Balance} amount={amountToken1} handleAmount={handleAmountToken1}
                    selectedToken={token1} tokenSelector={token1Selector} setTokenSelector={setToken1Selector}
                    quoteTokenSelector={token1Selector} protocolTokens={protocolTokens}/>
          <Box marginY={'5px'}>
            <ArrowDownIcon/>
          </Box>
          <Box borderBottom={'1px solid #343047'}>Pool share : {poolShare} %</Box>
        </Flex>
        <BlockFooter loading={loading} set={set} setAction={setAction} disabled={disabled}/>
      </Flex>
    )
  }

  const renderSet = () => {
    return (
      <Flex padding={'10px'} width={'450px'} borderRadius={'15px'} backgroundColor={'#201E2C'} flexDir={'column'}>
        <BlockHeader type={'Add liquidity'} protocolName={props.protocolName}
                     handleRemoveAction={props.handleRemoveAction} action={props.action} set={set}
                     unsetItem={unsetItem}/>
        <Flex padding='5px' marginTop='5px' marginBottom={'5px'} flexDir={'column'} flexWrap={'wrap'}
              alignItems={'center'}>
          <LockedAddInput amount={amountToken0} selectedToken={token0}/>
          <Box marginTop={'2px'}>
            <AddIcon
              cursor={'pointer'}
              onClick={switchTokens}/>
          </Box>
          <LockedAddInput amount={amountToken1} selectedToken={token1}/>
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


export default ActionBlockAdd;

