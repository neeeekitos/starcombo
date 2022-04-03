import React, {useState} from "react";
import styles from "./action-block-add.module.css";
import useComponentVisible from "../../hooks/UseComponentVisible";
import Image from "next/image";
import BatLogo from "../../public/img/tokens/bat.svg";
import EtherLogo from "../../public/img/tokens/ether.svg";
import TokenChooser from "../token-chooser";
import {Input} from "@chakra-ui/react";
import {PROTOCOLS} from "../../utils/constants/constants";


interface ActionBlockProps {
  actionName: string,
  protocolName: string,
  action: any
}

const ActionBlockAdd = (props: ActionBlockProps) => {

  const protocolTokens = PROTOCOLS[props.action.protocolName].tokens;
  const [addToken1, setAddToken1] = useState(protocolTokens[0]);
  const [addToken2, setAddToken2] = useState(protocolTokens[0]);
  const [amountToken1, setAmountToken1] = useState("0");
  const [amountToken2, setAmountToken2] = useState("0");
  const [estimation, setEstimation] = useState("0");

  const {ref, isComponentVisible, setIsComponentVisible} =
    useComponentVisible(false);

  return (
    <>
      <div className={styles.actionBlockWrapper} onClick={() => setIsComponentVisible(true)} hidden={isComponentVisible}>
        <div className={styles.actionBlockHead}>
          <div>
            <h3>{props.actionName} on {props.protocolName}</h3>
            <div className={styles.underlineTitle}/>
          </div>
        </div>
        <div className={styles.actionBlockBody}>
          <div className={styles.addLiquidity}>
            <div className={styles.tokenWrapperAdd}>
              <Image className={styles.cardImage} src={BatLogo} alt="img" width="50px" height="50px"/>
              <p className={styles.tokenAmount}>{amountToken1 === "" ? 0 : amountToken1}</p>
            </div>
            <div className={styles.space}/>
            <div className={styles.tokenWrapperAdd}>
              <Image className={styles.cardImage} src={EtherLogo} alt="img" width="50px" height="50px"/>
              <p className={styles.tokenAmount}>{amountToken2 === "" ? 0 : amountToken2}</p>
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
                  <line x1="2.45162" y1="43.9508" x2="26.9508" y2="1.54838" stroke="white" stroke-width="3"
                        stroke-linecap="round"/>
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
                selectedToken={addToken1}
                setSelectedToken={setAddToken1}
                selectableTokens={protocolTokens.filter((token) => token !== addToken1)}
              />
              <Input
                placeholder="Input amount"
                color="gray.300"
                height={"3rem"}
                borderColor="gray.300"
                _hover={{borderColor: "gray.500"}}
                _focus={{borderColor: "gray.500"}}
                value={amountToken1}
                onChange={(e) => setAmountToken1(e.target.value)}
                variant='flushed'
              />
            </div>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="9" y1="1" x2="9" y2="17" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <line x1="17" y1="9" x2="1" y2="9" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div className={styles.inputToken}>
              <TokenChooser
                selectedToken={addToken2}
                setSelectedToken={setAddToken2}
                selectableTokens={protocolTokens.filter((token) => token !== addToken2)}
              />
              <Input
                placeholder="Input amount"
                color="gray.300"
                height={"3rem"}
                borderColor="gray.300"
                _hover={{borderColor: "gray.500"}}
                _focus={{borderColor: "gray.500"}}
                value={amountToken2}
                onChange={(e) => setAmountToken2(e.target.value)}
                variant='flushed'
              />
            </div>
            <div className={styles.whiteLine}/>
            <div className={styles.totalLiquidityWrapper}>
              <p>Estimation: <span>{estimation}</span></p>
            </div>
            <button className={styles.sumbitButton} onClick={() => setIsComponentVisible(false)}>Submit</button>
          </div>
        </div>
      }
    </>
  )
}


export default ActionBlockAdd;