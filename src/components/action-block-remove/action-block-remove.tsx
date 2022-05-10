import React, {useEffect, useRef, useState} from "react";
import styles from "./action-block-remove.module.css";
import useComponentVisible from "../../hooks/UseComponentVisible";
import Image from "next/image";
import BatLogo from "../../../public/img/tokens/bat.svg";
import EtherLogo from "../../../public/img/tokens/ether.svg";
import TokenChooser from "../token-chooser";
import {Flex, Input, Spinner} from "@chakra-ui/react";
import {ProtocolNames, PROTOCOLS, SLIPPAGE} from "../../utils/constants/constants";
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
} from '@chakra-ui/react';
import {createTokenObjects} from "../../utils/helpers";
import {Fraction, Pair, Percent, Token, TokenAmount} from "@jediswap/sdk";
import {MySwap} from "../../protocols/mySwap";
import {useStarknet} from "../../hooks/useStarknet";
import {DexCombo, StarknetConnector} from "../../utils/constants/interfaces";
import {useAmounts} from "../../hooks/useAmounts";
import {useTransactions} from "../../hooks/useTransactions";
import {PoolPosition} from "../../protocols/jediSwap";
import {ethers} from "ethers";
import {Simulate} from "react-dom/test-utils";
import load = Simulate.load;

interface ActionBlockProps {
  actionName: string,
  protocolName: string,
  action: any,
  handleRemoveAction: (actionId: number) => void
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
    setAmountToken0(token0Amount.toSignificant(6))
    setAmountToken1(token1Amount.toSignificant(6))
  }, [sliderValue,loading])


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
    console.log(tokenLiqToRemove.raw.toString())
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


  return (
    <>
      <div className={styles.actionBlockWrapper} onClick={(e) => {
        if (outsideSetButton.current === e.target) return;
        setIsComponentVisible(true)
      }}
           hidden={isComponentVisible}>
        <div className={styles.actionBlockHead}>
          <div>
            <h3>{props.actionName} on {props.protocolName}</h3>
            <div className={styles.underlineTitle}/>
          </div>
        </div>
        <div className={styles.removeActionButton} onClick={(e) => {
          e.stopPropagation();
          props.handleRemoveAction(props.action.id)
        }}>
          <p>
            X
          </p>
        </div>
        <div className={styles.actionBlockBody}>
          <div className={styles.addLiquidity}>

            <div className={styles.poolWrapper}>
              <div>
                {/*<Image className={styles.cardImage} src={BatLogo} alt="img" width="50px" height="50px"/>*/}
                <div className={styles.tokenLogo}>
                  <span>{token1Selector.symbol}</span>
                </div>
                <svg width="20" height="31" viewBox="0 0 29 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="2.45162" y1="43.9508" x2="26.9508" y2="1.54838" stroke="white" strokeWidth="3"
                        strokeLinecap="round"/>
                </svg>
                {/*<Image className={styles.cardImage} src={EtherLogo} alt="img" width="50px" height="50px"/>*/}
                <div className={styles.tokenLogo}>
                  <span>{token1Selector.symbol}</span>
                </div>
              </div>
              <p>{sliderValue}%</p>
            </div>
            <svg className={styles.addLiquidityArrow} width="41" height="18" viewBox="0 0 61 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 10.5C1.17157 10.5 0.5 11.1716 0.5 12C0.5 12.8284 1.17157 13.5 2 13.5V10.5ZM60.0607 13.0607C60.6464 12.4749 60.6464 11.5251 60.0607 10.9393L50.5147 1.3934C49.9289 0.807612 48.9792 0.807612 48.3934 1.3934C47.8076 1.97918 47.8076 2.92893 48.3934 3.51472L56.8787 12L48.3934 20.4853C47.8076 21.0711 47.8076 22.0208 48.3934 22.6066C48.9792 23.1924 49.9289 23.1924 50.5147 22.6066L60.0607 13.0607ZM2 13.5H59V10.5H2V13.5Z"
                fill="white"/>
            </svg>
            <div className={styles.tokenWrapperAdd}>
              {/*<Image className={styles.cardImage} src={BatLogo} alt="img" width="50px" height="50px"/>*/}
              <div className={styles.tokenLogo}>
                <span>{token0Selector.symbol}</span>
              </div>
              <p className={styles.tokenAmount}>{amountToken0}</p>
            </div>
            <div className={styles.space}/>
            <div className={styles.tokenWrapperAdd}>
              {/*<Image className={styles.cardImage} src={EtherLogo} alt="img" width="50px" height="50px"/>*/}
              <div className={styles.tokenLogo}>
                <span>{token0Selector.symbol}</span>
              </div>
              <p className={styles.tokenAmount}>{amountToken1}</p>
            </div>

          </div>
        </div>
        {loading ? <Spinner/> : null}
        {!set && !loading &&
        <Flex justifyContent={'center'}>
          <button ref={outsideSetButton} className={styles.submitButtonExternal} onClick={(e) => {
            setAction();
          }}>
            Set
          </button>
        </Flex>
        }
      </div>

      {isComponentVisible &&
      <div className={styles.modalWrapper} ref={ref}>
        <div className={styles.modalHead}>
          <div>
            <h3>Remove Liquidity</h3>
            <div className={styles.underlineTitle}/>
          </div>
          <p>{props.protocolName}</p>
        </div>
        <div className={styles.modalBodyLiquidity}>
          <div className={styles.inputToken}>
            <TokenChooser
              selectedToken={token0Selector}
              setSelectedToken={setToken0Selector}
              selectableTokens={protocolTokens.filter((token) => token !== token1Selector)}
            />
            <TokenChooser
              selectedToken={token1Selector}
              setSelectedToken={setToken1Selector}
              selectableTokens={protocolTokens.filter((token) => token !== token0Selector)}
            />
            {userPoolTokenAmount &&
            <div>
              Your position
              : {parseFloat(ethers.utils.formatUnits(userPoolTokenAmount.raw.toString(), userPoolTokenAmount.token.decimals)).toPrecision(4)}
            </div>
            }

          </div>

          <div className={styles.sliderSelect}>
            <Slider value={sliderValue} aria-label='slider-ex-6' onChange={(val) => setSliderValue(val)}
                    colorScheme='purple'>
              <SliderMark value={0} mt='1' ml='-2.5' fontSize='sm' color='white'>
                0%
              </SliderMark>
              <SliderMark value={25} mt='1' ml='-2.5' fontSize='sm' color='white'>
                25%
              </SliderMark>
              <SliderMark value={50} mt='1' ml='-2.5' fontSize='sm' color='white'>
                50%
              </SliderMark>
              <SliderMark value={75} mt='1' ml='-2.5' fontSize='sm' color='white'>
                75%
              </SliderMark>
              <SliderMark value={100} mt='1' ml='-2.5' fontSize='sm' color='white'>
                100%
              </SliderMark>
              <SliderMark
                value={sliderValue}
                textAlign='center'
                bg='purple.600'
                color='white'
                mt='-10'
                ml='-5'
                w='12'
              >
                {sliderValue}%
              </SliderMark>
              <SliderTrack bg='purple.900'>
                <SliderFilledTrack/>
              </SliderTrack>
              <SliderThumb/>
            </Slider>

          </div>


          <div className={styles.whiteLine}/>
          Output estimates :
          <div className={styles.totalLiquidityWrapper}>
            <div className={styles.tokenWrapperAdd}>
              {/*<Image className={styles.cardImage} src={BatLogo} alt="img" width="50px" height="50px"/>*/}
              <div className={styles.tokenLogo}>
                <span>{token0Selector.symbol}</span>
              </div>
              <p className={styles.tokenAmount}>{amountToken0}</p>
            </div>
            <div className={styles.space}/>
            <div className={styles.tokenWrapperAdd}>
              {/*<Image className={styles.cardImage} src={EtherLogo} alt="img" width="50px" height="50px"/>*/}
              <div className={styles.tokenLogo}>
                <span>{token1Selector.symbol}</span>
              </div>
              <p className={styles.tokenAmount}>{amountToken1}</p>
            </div>
          </div>
          {loading &&
          <Flex alignItems={"center"} className={styles.submitButton}>Fetching route &nbsp; <Spinner/></Flex>
          }
          {!set && !loading &&
          <button className={styles.submitButton} onClick={() => setAction()}>Set</button>
          }
          {set &&
          <button className={styles.submitButton} onClick={() => unsetItem()}>Edit</button>
          }
        </div>
      </div>
      }
    </>
  )
}


export default ActionBlockAdd;
