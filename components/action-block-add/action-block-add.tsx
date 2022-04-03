import React, {ChangeEvent, useEffect, useState} from "react";
import styles from "./action-block-add.module.css";
import useComponentVisible from "../../hooks/UseComponentVisible";
import Image from "next/image";
import BatLogo from "../../public/img/tokens/bat.svg";
import EtherLogo from "../../public/img/tokens/ether.svg";
import TokenChooser from "../token-chooser";
import {Input} from "@chakra-ui/react";
import {PROTOCOLS, SLIPPAGE} from "../../utils/constants/constants";
import {useStarknet} from "../../hooks/useStarknet";
import {DexCombo, StarknetConnector, SwapParameters} from "../../utils/constants/interfaces";
import {useAmounts} from "../../hooks/useAmounts";
import {useTransactions} from "../../hooks/useTransactions";
import {Fraction, Pair, Price, Token, TokenAmount} from "@jediswap/sdk";
import {createTokenObjects} from "../../utils/helpers";
import {ethers} from "ethers";


interface ActionBlockProps {
  actionName: string,
  protocolName: string,
  action: any,
  handleRemoveAction: (actionId: number) => void,
}

const ActionBlockAdd = (props: ActionBlockProps) => {

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
  const [pair, setPair] = useState<Pair>();
  const [poolId, setPoolId] = useState<string>();
  const [token0, setToken0] = useState<Token>();
  const [token1, setToken1] = useState<Token>();
  const [loading, setLoading] = useState<boolean>(false);

  const [token0Selector, setToken0Selector] = useState(protocolTokens[0]);
  const [token1Selector, setToken1Selector] = useState(protocolTokens[1]);
  const [amountToken0, setAmountToken0] = useState("");
  const [amountToken1, setAmountToken1] = useState("");
  const [poolShare, setPoolShare] = useState<number>();
  const [estimation, setEstimation] = useState("");


  //effects
  useEffect(() => {

    const fetchPair = async () => {
      setLoading(true);
      const {
        tokenFrom: token0,
        tokenTo: token1
      } = await createTokenObjects(starknetConnector, token0Selector.address, token1Selector.address);
      setToken0(token0);
      setToken1(token1)
      const poolDetails = await protocolInstance.getPoolDetails(token0, token1, provider);
      const poolPair: Pair = poolDetails.poolPair;
      if (poolDetails.poolId) setPoolId(poolDetails.poolId)
      setPair(poolPair);
      setLoading(false);
    }
    fetchPair();

  }, [token0Selector, token1Selector])

  useEffect(() => {
    if (pair === undefined) return;
    let value = amountToken0;
    let direction = "to"
    if (isNaN(parseFloat(value))) {
      value = amountToken1;
      direction = "from";
    }
    setQuoteTokenAmount(value, direction)
  }, [pair])


  const handleAmountToken0 = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountToken0(value);
    if (!pair) return;
    setQuoteTokenAmount(value, "to")
  }

  const handleAmountToken1 = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountToken1(value);
    if (!pair) return;
    setQuoteTokenAmount(value, "from")
  }

  const setQuoteTokenAmount = (value, priceWanted) => {
    if (isNaN(parseFloat(value))) return;
    let tokenFrom: Token, tokenTo: Token, tokenFromIsToken0, tokenFromPrice: Price, tokenToPrice: Price,
      reserveFrom: TokenAmount;
    token0Selector.address === pair.token0.address ?
      [tokenFrom, tokenTo, tokenFromPrice, tokenToPrice, reserveFrom, tokenFromIsToken0] = [pair.token0, pair.token1, pair.token0Price, pair.token1Price, pair.reserve0, true] :
      [tokenFrom, tokenTo, tokenFromPrice, tokenToPrice, reserveFrom, tokenFromIsToken0] = [pair.token1, pair.token0, pair.token1Price, pair.token0Price, pair.reserve1, false];

    let poolShare;
    if (priceWanted === "from") {
      const parsedValue = ethers.utils.parseUnits(value, tokenTo.decimals)
      const parsedFromAmount = tokenToPrice.raw.multiply(parsedValue.toString())
      const amountFrom = parseFloat(ethers.utils.formatUnits(parsedFromAmount.toFixed(0), tokenFrom.decimals))
      setAmountToken0(amountFrom.toPrecision(6))
      // poolShare = parsedFromAmount.divide(reserveFrom).toFixed(0);
    } else {
      // to
      const parsedValue = ethers.utils.parseUnits(value, tokenFrom.decimals)
      const parsedToAmount = tokenFromPrice.raw.multiply(parsedValue.toString())
      const amountTo = parseFloat(ethers.utils.formatUnits(parsedToAmount.toFixed(0), tokenTo.decimals))
      setAmountToken1(amountTo.toPrecision(6))
      // poolShare = new Fraction(parsedValue.toString()).divide(reserveFrom).toFixed(0);
    }
    //TODO if time
    setPoolShare(poolShare)

  }

  const switchTokens = () => {
    const token1Temp = token0Selector;
    const amount1Temp = amountToken0;
    setToken0Selector(token1Selector);
    setToken1Selector(token1Temp);
    setAmountToken0(amountToken1);
    setAmountToken1(amount1Temp);
  }

  const submitAction = async () => {
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
    const tokenAmountFrom = new TokenAmount(token0, ethers.utils.parseUnits(amountToken0,token0.decimals).toString());
    const txLiq = await protocolInstance.addLiquidity(starknetConnector, pair, SLIPPAGE, tokenAmountFrom)

    addTransaction({
      [props.action.id]: txLiq.call
    })
    setIsComponentVisible(!isComponentVisible)
  }

  return (
    <>
      <div className={styles.actionBlockWrapper} onClick={() => setIsComponentVisible(true)}
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
            <div className={styles.tokenWrapperAdd}>
              <Image className={styles.cardImage} src={BatLogo} alt="img" width="50px" height="50px"/>
              <p className={styles.tokenAmount}>{amountToken0 === "" ? 0 : amountToken0}</p>
            </div>
            <div className={styles.space}/>
            <div className={styles.tokenWrapperAdd}>
              <Image className={styles.cardImage} src={EtherLogo} alt="img" width="50px" height="50px"/>
              <p className={styles.tokenAmount}>{amountToken1 === "" ? 0 : amountToken1}</p>
            </div>
            <svg className={styles.addLiquidityArrow} width="61" height="24" viewBox="0 0 61 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 10.5C1.17157 10.5 0.5 11.1716 0.5 12C0.5 12.8284 1.17157 13.5 2 13.5V10.5ZM60.0607 13.0607C60.6464 12.4749 60.6464 11.5251 60.0607 10.9393L50.5147 1.3934C49.9289 0.807612 48.9792 0.807612 48.3934 1.3934C47.8076 1.97918 47.8076 2.92893 48.3934 3.51472L56.8787 12L48.3934 20.4853C47.8076 21.0711 47.8076 22.0208 48.3934 22.6066C48.9792 23.1924 49.9289 23.1924 50.5147 22.6066L60.0607 13.0607ZM2 13.5H59V10.5H2V13.5Z"
                fill="white"/>
            </svg>
            <div className={styles.poolWrapper}>
              <div>
                <Image className={styles.cardImage} src={BatLogo} alt="img" width="50px" height="50px"/>
                <svg width="29" height="46" viewBox="0 0 29 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="2.45162" y1="43.9508" x2="26.9508" y2="1.54838" stroke="white" strokeWidth="3"
                        strokeLinecap="round"/>
                </svg>
                <Image className={styles.cardImage} src={EtherLogo} alt="img" width="50px" height="50px"/>
              </div>
              <p>{estimation}</p>
            </div>
          </div>
        </div>
      </div>

      {isComponentVisible &&
      <div className={styles.modalWrapper} ref={ref}>
        <div className={styles.modalHead}>
          <div>
            <h3>Add Liquidity</h3>
            <div className={styles.underlineTitle}/>
          </div>
        </div>
        <div className={styles.modalBodyLiquidity}>
          <div className={styles.inputToken}>
            <TokenChooser
              selectedToken={token0Selector}
              setSelectedToken={setToken0Selector}
              selectableTokens={protocolTokens.filter((token) => token !== token1Selector)}
            />
            <Input
              placeholder="Input amount"
              color="gray.300"
              height={"3rem"}
              borderColor="gray.300"
              _hover={{borderColor: "gray.500"}}
              _focus={{borderColor: "gray.500"}}
              value={amountToken0}
              onKeyPress={(event) => {
                if (!/[0-9]/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              onChange={(e) => handleAmountToken0(e)}
              variant='flushed'
            />
          </div>
          <svg onClick={() => switchTokens()} width="18" height="18" viewBox="0 0 18 18" fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <line x1="9" y1="1" x2="9" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="17" y1="9" x2="1" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div className={styles.inputToken}>
            <TokenChooser
              selectedToken={token1Selector}
              setSelectedToken={setToken1Selector}
              selectableTokens={protocolTokens.filter((token) => token !== token0Selector)}
            />
            <Input
              placeholder="Input amount"
              color="gray.300"
              height={"3rem"}
              borderColor="gray.300"
              _hover={{borderColor: "gray.500"}}
              _focus={{borderColor: "gray.500"}}
              value={amountToken1}
              onKeyPress={(event) => {
                if (!/[0-9]/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              onChange={(e) => handleAmountToken1(e)}
              variant='flushed'
            />
          </div>
          <div className={styles.whiteLine}/>
          <div className={styles.totalLiquidityWrapper}>
            {poolShare && <p>Your pool share: <span>{poolShare.toString()}</span></p>}
          </div>
          {loading ? <button className={styles.sumbitButton} disabled>Fetching route</button>
            : <button className={styles.sumbitButton} onClick={() => submitAction()}>Submit</button>
          }
        </div>
      </div>
      }
    </>
  )
}


export default ActionBlockAdd;
