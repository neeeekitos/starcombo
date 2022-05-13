import React, {useEffect, useRef, useState} from "react";
import useComponentVisible from "../../hooks/UseComponentVisible";
import {Box, Flex, Grid} from "@chakra-ui/react";
import {ProtocolNames, PROTOCOLS, SLIPPAGE} from "../../utils/constants/constants";
import {createTokenObjects} from "../../utils/helpers";
import {Fraction, Pair, Percent, Token, TokenAmount} from "@jediswap/sdk";
import {useStarknet} from "../../hooks/useStarknet";
import {DexCombo, StarknetConnector} from "../../utils/constants/interfaces";
import {useAmounts} from "../../hooks/useAmounts";
import {useTransactions} from "../../hooks/useTransactions";
import {PoolPosition} from "../../protocols/Jediswap/jediSwap";
import {ethers} from "ethers";
import {ArrowDownIcon} from "@chakra-ui/icons";
import RemoveField from "./RemoveField";
import BlockFooter from "../BlockFooter";
import RemoveSlider from "./RemoveSlider";
import BlockHeader from "../BlockHeader";
import LockedRemoveToken from "./LockedRemoveToken";

interface ActionBlockProps {
  actionName: string,
  protocolName: string,
  action: any,
  handleRemoveAction: (actionId: number) => void
}

const Remove = (props: ActionBlockProps) => {

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
  const [loading, setLoading] = useState<boolean>(false);

  const [token0Selector, setToken0Selector] = useState(protocolTokens[0]);
  const [token1Selector, setToken1Selector] = useState(protocolTokens[1]);
  const [token0, setToken0] = useState<Token>();
  const [token1, setToken1] = useState<Token>();
  const [amountToken0, setAmountToken0] = useState("");
  const [amountToken1, setAmountToken1] = useState("");
  const [poolPosition, setPoolPosition] = useState<PoolPosition>();

  const [userPoolTokenAmount, setUserPoolTokenAmount] = useState<TokenAmount>();
  const [estimation, setEstimation] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [liqToRemove, setLiqToRemove] = useState<Fraction>();

  //If the component has been set by the user
  const [set, setSet] = useState<boolean>(false)

  //REFS//
  const outsideSetButton = useRef(null);

  useEffect(() => {
    setAmountToken0('0')
    setAmountToken1('0')
    const fetchPair = async () => {
      setLoading(true);
      const {
        tokenFrom: token0,
        tokenTo: token1
      } = await createTokenObjects(starknetConnector, token0Selector.address, token1Selector.address);
      setToken0(token0);
      setToken1(token1)

      let poolPosition: PoolPosition;
      if (props.protocolName === PROTOCOLS[ProtocolNames.JEDISWAP].name) {
        const {poolPair}: { poolPair: Pair } = await protocolInstance.getPoolDetails(token0, token1, provider);
        poolPosition = await protocolInstance.getLiquidityPosition(starknetConnector, token0, token1, poolPair);
      } else {
        poolPosition = await protocolInstance.getLiquidityPosition(starknetConnector, token0, token1);
      }
      setPoolPosition(poolPosition)
      setLoading(false);
    }
    fetchPair();

  }, [token0Selector, token1Selector])

  useEffect(() => {

    unsetItem();

    //poolInfo
    if (!poolPosition) return;
    const {poolPair}: { poolPair: Pair } = poolPosition;

    //liq to remove
    const sliderPercent = new Percent(sliderValue.toString(), "100");

    setUserPoolTokenAmount(poolPosition.userLiquidity)

    const liqToRemove = poolPosition.userLiquidity.multiply(sliderPercent);
    let poolShare = liqToRemove.divide(poolPosition.poolSupply);
    setLiqToRemove(liqToRemove)

    //tokenAmounts
    const token0isPoolToken0 = token0.address === poolPair.token0.address;
    let token0Amount = token0isPoolToken0 ? poolPair.reserve0.multiply(poolShare) : poolPair.reserve1.multiply(poolShare);
    let token1Amount = token0isPoolToken0 ? poolPair.reserve1.multiply(poolShare) : poolPair.reserve0.multiply(poolShare);
    setAmountToken0(token0Amount.subtract(token0Amount.multiply(SLIPPAGE)).toSignificant(6))
    setAmountToken1(token1Amount.subtract(token1Amount.multiply(SLIPPAGE)).toSignificant(6))

  }, [sliderValue, loading])


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
    const {liquidityToken} = poolPosition.poolPair;
    const tokenLiqToRemove = new TokenAmount(liquidityToken, ethers.utils.parseUnits(liqToRemove.toFixed(liquidityToken.decimals), liquidityToken.decimals).toString());
    const txLiq = await protocolInstance.removeLiquidity(starknetConnector, poolPosition, tokenLiqToRemove)

    addTransaction({
      [props.action.id]: txLiq.call
    })
    setIsComponentVisible(false)
    setSet(true);

  }

  //Removes item from set.
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
        <BlockHeader type={'Remove liquidity'} protocolName={props.protocolName}
                     handleRemoveAction={props.handleRemoveAction} action={props.action} set={set}
                     unsetItem={unsetItem}/>
        <Flex padding='10px' marginTop='10px' marginBottom={'10px'} flexDir={'column'}
              alignItems={'center'}>
          <RemoveSlider sliderValue={sliderValue} setSliderValue={setSliderValue}/>
          <Box marginY={'5px'}>
            <ArrowDownIcon/>
          </Box>
          <Flex justifyContent={'space-between'} alignItems='center' flexDir={'column'} backgroundColor={'#343047'}
                width={'90%'}
                borderRadius={'20px'} padding={'10px'}>
            <RemoveField tokenSelector={token0Selector} setTokenSelector={setToken0Selector} amountToken={amountToken0}
                         protocolTokens={protocolTokens} quoteTokenSelector={token1Selector}/>
            <Box height={'10px'}></Box>
            <RemoveField tokenSelector={token1Selector} setTokenSelector={setToken1Selector} amountToken={amountToken1}
                         protocolTokens={protocolTokens} quoteTokenSelector={token1Selector}/>

          </Flex>

        </Flex>
        <BlockFooter loading={loading} set={set} setAction={setAction} disabled={false}/>
      </Flex>
    )
  }

  const renderSet = () => {
    return (
      <Flex padding={'10px'} width={'450px'} borderRadius={'15px'} backgroundColor={'#201E2C'} flexDir={'column'}>
        <BlockHeader type={'Remove liquidity'} protocolName={props.protocolName}
                     handleRemoveAction={props.handleRemoveAction} action={props.action} set={set}
                     unsetItem={unsetItem}/>
        <Flex padding='5px' marginTop='5px' marginBottom={'5px'} flexDir={'column'}
              alignItems={'center'}>
          <Grid templateColumns={'2fr 1fr'} width={'90%'}>
            <Box marginLeft='10px' width='100%' marginRight={'auto'} borderBottom={'1px solid #343047'}>{sliderValue}%</Box>
            <span>{token0Selector.symbol}/{token1Selector.symbol}</span>
          </Grid>
          <Box marginY={'5px'}>
            <ArrowDownIcon/>
          </Box>
          <LockedRemoveToken amount={amountToken0} selectedToken={token0Selector}/>
          <LockedRemoveToken amount={amountToken1} selectedToken={token1Selector}/>
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


export default Remove;
