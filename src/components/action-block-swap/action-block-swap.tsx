import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import styles from "./action-block.module.css";
import Image from "next/image";
import EtherLogo from "../../../public/img/tokens/ether.svg";
import BatLogo from "../../../public/img/tokens/bat.svg";

import {ACTIONS, PROTOCOLS, SELECTABLE_TOKENS, SLIPPAGE} from "../../utils/constants/constants";

import {Flex, Input, Spinner} from "@chakra-ui/react";
import TokenChooser from "../token-chooser";
import useComponentVisible from "../../hooks/UseComponentVisible";
import {useAmounts} from "../../hooks/useAmounts";
import {useStarknet} from "../../hooks/useStarknet";
import {DexCombo, StarknetConnector, SwapParameters} from "../../utils/constants/interfaces";
import {createTokenObjects, formatToBigNumberish, formatToDecimal} from "../../utils/helpers";
import {Fraction, Pair, Price, Token, TokenAmount} from "@jediswap/sdk";
import {number} from "starknet";
import {ethers} from "ethers";
import {useTransactions} from "../../hooks/useTransactions";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';

interface ActionBlockProps {
  actionName: string,
  protocolName: string,
  action: any,
  handleRemoveAction: (actionId: number) => void,
}

interface ExecutionPrices {
  priceAtoB:number,
  priceBtoA:number
}

const ActionBlockSwap = (props: ActionBlockProps) => {
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
  const [tokenFromSelector, setTokenFromSelector] = useState(protocolTokens[0]);
  const [tokenToSelector, setTokenToSelector] = useState(protocolTokens[1]);

  // LP pair
  const [pair, setPair] = useState<Pair>();
  const [prices,setPrices] = useState<ExecutionPrices>();

  //poolId required to use with mySwap
  const [poolId, setPoolId] = useState<string>();

  //Token objects with decimals
  const [tokenFrom, setTokenFrom] = useState<Token>();
  const [tokenTo, setTokenTo] = useState<Token>();

  //When loading route
  const [loading, setLoading] = useState<boolean>(false);

  //If the component has been set by the user
  const [set, setSet] = useState<boolean>(false)

  //REFS//
  const outsideSetButton = useRef(null);

  //When changing tokens in swap component
  useEffect(() => {

    //Reset states
    setPrices({priceAtoB:0,priceBtoA:0})
    setAmountFrom('0')
    setAmountTo('0')
    unsetItem();

    //Fetch pool pair
    const fetchPair = async () => {
      setLoading(true);
      const {tokenFrom, tokenTo} =
        await createTokenObjects(starknetConnector, tokenFromSelector.address, tokenToSelector.address);
      setTokenFrom(tokenFrom);
      setTokenTo(tokenTo);
      const poolDetails = await protocolInstance.getPoolDetails(tokenFrom, tokenTo, provider);
      const poolPair: Pair = poolDetails.poolPair;
      if (poolDetails.poolId) setPoolId(poolDetails.poolId)
      setPair(poolPair);

      //get execution prices when interacting with pool
      const swapParameters: SwapParameters = {
        tokenFrom: tokenFrom,
        tokenTo: tokenTo,
        amountIn: '1',
        amountOut: "0", //TODO support for this
        poolPair: pair,
      }
      const {execPrice} = await protocolInstance.getSwapExecutionPrice(starknetConnector, swapParameters);
      const priceAtoB = execPrice;
      const priceBtoA = 1/execPrice;
      setPrices({priceAtoB: priceAtoB,priceBtoA: priceBtoA})

      setLoading(false);
    }
    fetchPair();

  }, [tokenFromSelector, tokenToSelector])

  //When changing pair
  useEffect(() => {
    unsetItem();
    if (pair === undefined) return;
    let value = amountFrom;
    let direction = "to"
    if (isNaN(parseFloat(value))) {
      value = amountTo;
      direction = "from";
    }
    setQuoteTokenAmount(value, direction)
  }, [pair])


  //Removes item from set.
  const unsetItem = () => {
    if (set) {
      setSet(false);
      removeItem(props.action.id);
      removeTransaction(props.action.id)
    }
  }

  //User input inside amount from
  const handleAmountFrom = (e: ChangeEvent<HTMLInputElement>) => {
    unsetItem();
    let value = e.target.value;
    if (isNaN(value as any)) return;
    setAmountFrom(value);
    if (!pair) return;
    setQuoteTokenAmount(value, "to")
  }

  //User input inside amount to
  const handleAmountTo = (e: ChangeEvent<HTMLInputElement>) => {
    unsetItem();
    let value = e.target.value;
    if (isNaN(value as any)) return;
    setAmountTo(value);
    if (!pair) return;
    setQuoteTokenAmount(value, "from")
  }

  //Calculates the amount of quote token for user's input
  const setQuoteTokenAmount = (value, priceWanted) => {
    if (value === '') value = '0'
    if (isNaN(value as any)) return;

    if (priceWanted === "from") {
      const amountFrom = value*prices.priceBtoA
      setAmountFrom(amountFrom.toPrecision(6))
    } else {
      // to
      const amountTo = value*prices.priceAtoB
      setAmountTo(amountTo.toPrecision(6))
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
    }

    if(amountFrom==='0') {NotificationManager.error("Can't swap a null amount"); return;}

    //We need details to know the minimum amount the user will receive
    const {call,details} = poolId ? (await protocolInstance.swap(starknetConnector, swapParameters, poolId)) : (await protocolInstance.swap(starknetConnector, swapParameters))

    //Add item to the recap DS
    addItem({
      [props.action.id]: {
        actionType: props.actionName,
        tokens: {
          [tokenFromSelector.name]: parseFloat(amountFrom),
          [tokenToSelector.name]: parseFloat(formatToDecimal(details.amountOutMin,tokenTo.decimals))
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

  return (

    <div className={styles.wrapperComponent}>
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
          <>
            <div className={styles.tokenWrapper}>
              <Image className={styles.cardImage} src={BatLogo} alt="img" width="50px" height="50px"/>
              <div className={styles.shadow}/>
              <p>{amountFrom} {tokenFromSelector.symbol}</p>
            </div>
            <svg width="50" height="70" viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M79.3142 16.4142C80.0952 15.6332 80.0952 14.3668 79.3142 13.5858L66.5863 0.85787C65.8052 0.0768214 64.5389 0.0768213 63.7579 0.85787C62.9768 1.63892 62.9768 2.90525 63.7579 3.6863L75.0716 15L63.7578 26.3137C62.9768 27.0948 62.9768 28.3611 63.7578 29.1421C64.5389 29.9232 65.8052 29.9232 66.5863 29.1421L79.3142 16.4142ZM2 17L77.9 17L77.9 13L2 13L2 17Z"
                fill="white"/>
              <path
                d="M0.585787 58.4142C-0.195262 57.6332 -0.195262 56.3668 0.585786 55.5858L13.3137 42.8579C14.0948 42.0768 15.3611 42.0768 16.1421 42.8579C16.9232 43.6389 16.9232 44.9052 16.1421 45.6863L4.82843 57L16.1421 68.3137C16.9232 69.0948 16.9232 70.3611 16.1421 71.1421C15.3611 71.9232 14.0948 71.9232 13.3137 71.1421L0.585787 58.4142ZM77.9 59L2 59L2 55L77.9 55L77.9 59Z"
                fill="white"/>
            </svg>
            <div className={styles.tokenWrapper}>
              <Image className={styles.cardImage} src={EtherLogo} alt="img" width="50px" height="50px"/>
              <div className={styles.shadow}/>
              <p>{amountTo} {tokenToSelector.symbol}</p>
            </div>
          </>
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


      {
        isComponentVisible &&
        <div className={styles.modalWrapper} ref={ref}>
          <div className={styles.modalHead}>
            <div>
              <h3>Swap</h3>
              <div className={styles.underlineTitle}/>
            </div>
          </div>

          <div className={styles.modalBody}>
            <h2 className={styles.h2Modal}>From: </h2>
            <div className={styles.inputToken}>
              <TokenChooser
                selectedToken={tokenFromSelector}
                setSelectedToken={setTokenFromSelector}
                selectableTokens={protocolTokens.filter((token) => token !== tokenToSelector)}
              />
              <Input
                placeholder="Input amount"
                color="gray.300"
                height={"3rem"}
                borderColor="gray.300"
                _hover={{borderColor: "gray.500"}}
                _focus={{borderColor: "gray.500"}}
                value={amountFrom}
                onKeyPress={(event) => {
                  if (!/^[0-9]+.?[0-9]*$/.test(amountFrom + event.key)) {
                    event.preventDefault();
                  }
                }}
                onChange={(e) => handleAmountFrom(e)}
                variant='flushed'
              />
            </div>

            <svg onClick={() => switchTokens()} className={styles.modalArrows} width="50" height="70"
                 viewBox="0 0 80 72" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <path
                d="M79.3142 16.4142C80.0952 15.6332 80.0952 14.3668 79.3142 13.5858L66.5863 0.85787C65.8052 0.0768214 64.5389 0.0768213 63.7579 0.85787C62.9768 1.63892 62.9768 2.90525 63.7579 3.6863L75.0716 15L63.7578 26.3137C62.9768 27.0948 62.9768 28.3611 63.7578 29.1421C64.5389 29.9232 65.8052 29.9232 66.5863 29.1421L79.3142 16.4142ZM2 17L77.9 17L77.9 13L2 13L2 17Z"
                fill="white"/>
              <path
                d="M0.585787 58.4142C-0.195262 57.6332 -0.195262 56.3668 0.585786 55.5858L13.3137 42.8579C14.0948 42.0768 15.3611 42.0768 16.1421 42.8579C16.9232 43.6389 16.9232 44.9052 16.1421 45.6863L4.82843 57L16.1421 68.3137C16.9232 69.0948 16.9232 70.3611 16.1421 71.1421C15.3611 71.9232 14.0948 71.9232 13.3137 71.1421L0.585787 58.4142ZM77.9 59L2 59L2 55L77.9 55L77.9 59Z"
                fill="white"/>
            </svg>

            <h2 className={styles.h2Modal}>To: </h2>
            <div className={styles.inputToken}>
              <TokenChooser
                selectedToken={tokenToSelector}
                setSelectedToken={setTokenToSelector}
                selectableTokens={protocolTokens.filter((token) => token !== tokenFromSelector)}
              />
              <Input
                placeholder="Input amount"
                color="gray.300"
                height={"3rem"}
                borderColor="gray.300"
                _hover={{borderColor: "gray.500"}}
                _focus={{borderColor: "gray.500"}}
                value={amountTo}
                onKeyPress={(event) => {
                  if (!/^[0-9]+.?[0-9]*$/.test(amountTo + event.key)) {
                    event.preventDefault();
                  }
                }}
                onChange={(e) => handleAmountTo(e)}
                variant='flushed'
              />
            </div>
            <div className={styles.modalFooter}>
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
        </div>
      }
    </div>
  )
}


export default ActionBlockSwap;
