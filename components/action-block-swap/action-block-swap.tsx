import React, {ChangeEvent, useEffect, useState} from "react";
import styles from "./action-block.module.css";
import Image from "next/image";
import EtherLogo from "../../public/img/tokens/ether.svg";
import BatLogo from "../../public/img/tokens/bat.svg";

import {ACTIONS, PROTOCOLS, SELECTABLE_TOKENS, SLIPPAGE} from "../../utils/constants/constants";

import {Input} from "@chakra-ui/react";
import TokenChooser from "../token-chooser";
import useComponentVisible from "../../hooks/UseComponentVisible";
import {useAmounts} from "../../hooks/useAmounts";
import {useStarknet} from "../../hooks/useStarknet";
import {DexCombo, StarknetConnector, SwapParameters} from "../../utils/constants/interfaces";
import {createTokenObjects} from "../../utils/helpers";
import {Fraction, Pair, Price, Token, TokenAmount} from "@jediswap/sdk";
import {number} from "starknet";
import {ethers} from "ethers";
import {useTransactions} from "../../hooks/useTransactions";
import {add} from "@noble/hashes/_u64";
import {Simulate} from "react-dom/test-utils";
import load = Simulate.load;

interface ActionBlockProps {
  actionName: string,
  protocolName: string,
  action: any,
  handleRemoveAction: (actionId: number) => void,
}

const ActionBlockSwap = (props: ActionBlockProps) => {
  //custom hooks
  const {account, provider} = useStarknet();
  const starknetConnector: StarknetConnector = {
    account: account,
    provider: provider
  }
  const {addItem, addToken} = useAmounts();
  const {addTransaction} = useTransactions();
  const {
    tokens: protocolTokens,
    instance: protocolInstance
  }: { tokens: any, instance: DexCombo } = PROTOCOLS[props.action.protocolName];
  const {ref, isComponentVisible, setIsComponentVisible} =
    useComponentVisible(false);

  //states
  const [amountFrom, setAmountFrom] = useState("");
  const [tokenFromSelector, setTokenFromSelector] = useState(protocolTokens[0]);
  const [tokenToSelector, setTokenToSelector] = useState(protocolTokens[1]);
  const [amountTo, setAmountTo] = useState("");
  const [pair, setPair] = useState<Pair>();
  const [poolId,setPoolId] = useState<string>();
  const [tokenFrom, setTokenFrom] = useState<Token>();
  const [tokenTo, setTokenTo] = useState<Token>();
  const [loading, setLoading] = useState<boolean>(false);


  //effects
  useEffect(() => {

    const fetchPair = async () => {
      setLoading(true);
      const {
        tokenFrom,
        tokenTo
      } = await createTokenObjects(starknetConnector, tokenFromSelector.address, tokenToSelector.address);
      setTokenFrom(tokenFrom);
      setTokenTo(tokenTo)
      const poolDetails = await protocolInstance.getPoolDetails(tokenFrom, tokenTo, provider);
      const poolPair: Pair = poolDetails.poolPair;
      if(poolDetails.poolId) setPoolId(poolDetails.poolId)
      setPair(poolPair);
      setLoading(false);
    }

    fetchPair();

  }, [tokenFromSelector, tokenToSelector])

  useEffect(() => {
    if (pair === undefined) return;
    let value = amountFrom;
    let direction = "to"
    if (isNaN(parseFloat(value))) {
      value = amountTo;
      direction = "from";
    }
    setQuoteTokenAmount(value, direction)
  }, [pair])


  const handleAmountFrom = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountFrom(value);
    if (!pair) return;
    setQuoteTokenAmount(value, "to")
  }

  const handleAmountTo = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountTo(value);
    if (!pair) return;
    setQuoteTokenAmount(value, "from")
  }

  const setQuoteTokenAmount = (value, priceWanted) => {
    if (isNaN(parseFloat(value))) return;
    let tokenFrom: Token, tokenTo: Token, tokenFromIsToken0, tokenFromPrice: Price, tokenToPrice: Price;
    tokenFromSelector.address === pair.token0.address ?
      [tokenFrom, tokenTo, tokenFromPrice, tokenToPrice, tokenFromIsToken0] = [pair.token0, pair.token1, pair.token0Price, pair.token1Price, true] :
      [tokenFrom, tokenTo, tokenFromPrice, tokenToPrice, tokenFromIsToken0] = [pair.token1, pair.token0, pair.token1Price, pair.token0Price, false];

    if (priceWanted === "from") {
      const parsedValue = ethers.utils.parseUnits(value, tokenTo.decimals)
      const parsedFromAmount = tokenToPrice.raw.multiply(parsedValue.toString())
      const amountFrom = parseFloat(ethers.utils.formatUnits(parsedFromAmount.toFixed(0), tokenFrom.decimals)).toPrecision(6)
      setAmountFrom(amountFrom)
    } else {
      // to
      const parsedValue = ethers.utils.parseUnits(value, tokenFrom.decimals)
      const parsedToAmount = tokenFromPrice.raw.multiply(parsedValue.toString())
      const amountTo = parseFloat(ethers.utils.formatUnits(parsedToAmount.toFixed(0), tokenTo.decimals)).toPrecision(6)
      setAmountTo(amountTo)

    }
  }

  //TODO fill these functions once we have the required elements
  const addSwapAction = () => {

  }

  const addAddLiquidityAction = () => {

  }

  const addRemoveLiquidityAction = () => {

  }

  const switchTokens = () => {
    const tempFrom = tokenFromSelector;
    const tempAmtFrom = amountFrom;
    setTokenFromSelector(tokenToSelector);
    setTokenToSelector(tempFrom);
    setAmountFrom(amountTo);
    setAmountTo(tempAmtFrom);
  }

  const submitAction = async () => {
    //TODO depending on the props.actionName this should change because the tokens involved will not be the same.
    // So here it only works for swaps now. We need to integrate add and remove liq in the action blocks.
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
    const swapParameters: SwapParameters = {
      tokenFrom: tokenFrom,
      tokenTo: tokenTo,
      amountIn: amountFrom,
      amountOut: "0", //TODO support for this
      poolPair: pair,
    }
    console.log(poolId)
    const call = poolId ? (await protocolInstance.swap(starknetConnector, swapParameters, poolId)).call : (await protocolInstance.swap(starknetConnector, swapParameters)).call
    addTransaction({
      [props.action.id]: call
    })
    setIsComponentVisible(!isComponentVisible)
  }

  return (
    <div className={styles.wrapperComponent}>
      <div className={styles.actionBlockWrapper} onClick={() => setIsComponentVisible(true)}>
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
      </div>

      {
        isComponentVisible ?
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
                    if (!/[0-9]/.test(event.key)) {
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
                    if (!/[0-9]/.test(event.key)) {
                      event.preventDefault();
                    }
                  }}
                  onChange={(e) => handleAmountTo(e)}
                  variant='flushed'
                />
              </div>
              <div className={styles.modalFooter}>
                {loading ? <button className={styles.sumbitButton} disabled>Fetching route</button>
                  : <button className={styles.sumbitButton} onClick={() => submitAction()}>Submit</button>
                }
              </div>

            </div>
          </div> : null}
    </div>
  )
}


export default ActionBlockSwap;
