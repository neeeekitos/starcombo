import React, {useEffect, useState} from "react";
import styles from "./action-block.module.css";
import Image from "next/image";
import EtherLogo from "../../public/img/tokens/ether.svg";
import BatLogo from "../../public/img/tokens/bat.svg";

import { SELECTABLE_TOKENS } from "../../utils/constants/constants";

import { Input } from "@chakra-ui/react";
import TokenChooser from "../token-chooser";
import useComponentVisible from "../../hooks/UseComponentVisible";


const ActionBlock = (props: any) => {

  const [amountSend, setAmountSend] = useState("");
  const [tokenSend, setTokenSend] = useState(SELECTABLE_TOKENS[0]);
  const [tokenRecevied, setTokenRecevied] = useState(SELECTABLE_TOKENS[1]);
  const [amountRecevied, setAmountRecevied] = useState("");

  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);

  console.log(SELECTABLE_TOKENS[0]);

  return(
    <div className={styles.wrapperComponent}>
      <div className={styles.actionBlockWrapper} onClick={() => setIsComponentVisible(true)}>
        <div className={styles.actionBlockHead}>
          <div>
            <h3>{props.actionName} on {props.protocolName}</h3>
            <div className={styles.underlineTitle}/>
          </div>
        </div>

        <div className={styles.actionBlockBody}>
          <div className={styles.tokenWrapper}>
            <Image className={styles.cardImage} src = {BatLogo}  alt = "img" width="50px" height="50px"/>
            <div className={styles.shadow}></div>
            <p>{amountSend} {tokenSend.symbol}</p>
          </div>
          <svg width="50" height="70" viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M79.3142 16.4142C80.0952 15.6332 80.0952 14.3668 79.3142 13.5858L66.5863 0.85787C65.8052 0.0768214 64.5389 0.0768213 63.7579 0.85787C62.9768 1.63892 62.9768 2.90525 63.7579 3.6863L75.0716 15L63.7578 26.3137C62.9768 27.0948 62.9768 28.3611 63.7578 29.1421C64.5389 29.9232 65.8052 29.9232 66.5863 29.1421L79.3142 16.4142ZM2 17L77.9 17L77.9 13L2 13L2 17Z" fill="white"/>
            <path d="M0.585787 58.4142C-0.195262 57.6332 -0.195262 56.3668 0.585786 55.5858L13.3137 42.8579C14.0948 42.0768 15.3611 42.0768 16.1421 42.8579C16.9232 43.6389 16.9232 44.9052 16.1421 45.6863L4.82843 57L16.1421 68.3137C16.9232 69.0948 16.9232 70.3611 16.1421 71.1421C15.3611 71.9232 14.0948 71.9232 13.3137 71.1421L0.585787 58.4142ZM77.9 59L2 59L2 55L77.9 55L77.9 59Z" fill="white"/>
          </svg>
          <div className={styles.tokenWrapper}>
            <Image className={styles.cardImage} src = {EtherLogo}  alt = "img" width="50px" height="50px"/>
            <div className={styles.shadow}></div>
            <p>{amountRecevied} {tokenRecevied.symbol}</p>
          </div>
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
                selectedToken={tokenSend}
                setSelectedToken={setTokenSend}
                selectableTokens={SELECTABLE_TOKENS}
              />
              <Input
                placeholder="Input amount"
                color="gray.300"
                height={"3rem"}
                borderColor="gray.300"
                _hover={{borderColor: "gray.500"}}
                _focus={{borderColor: "gray.500"}}
                value={amountSend}
                onChange={(e) => setAmountSend(e.target.value)}
                variant='flushed'
              />
            </div>

            <svg className={styles.modalArrows} width="50" height="70" viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M79.3142 16.4142C80.0952 15.6332 80.0952 14.3668 79.3142 13.5858L66.5863 0.85787C65.8052 0.0768214 64.5389 0.0768213 63.7579 0.85787C62.9768 1.63892 62.9768 2.90525 63.7579 3.6863L75.0716 15L63.7578 26.3137C62.9768 27.0948 62.9768 28.3611 63.7578 29.1421C64.5389 29.9232 65.8052 29.9232 66.5863 29.1421L79.3142 16.4142ZM2 17L77.9 17L77.9 13L2 13L2 17Z" fill="white"/>
              <path d="M0.585787 58.4142C-0.195262 57.6332 -0.195262 56.3668 0.585786 55.5858L13.3137 42.8579C14.0948 42.0768 15.3611 42.0768 16.1421 42.8579C16.9232 43.6389 16.9232 44.9052 16.1421 45.6863L4.82843 57L16.1421 68.3137C16.9232 69.0948 16.9232 70.3611 16.1421 71.1421C15.3611 71.9232 14.0948 71.9232 13.3137 71.1421L0.585787 58.4142ZM77.9 59L2 59L2 55L77.9 55L77.9 59Z" fill="white"/>
            </svg>

            <h2 className={styles.h2Modal}>To: </h2>
            <div className={styles.inputToken}>
              <TokenChooser
                selectedToken={tokenSend}
                setSelectedToken={setTokenRecevied}
                selectableTokens={SELECTABLE_TOKENS}
              />
              <Input
                placeholder="Input amount"
                color="gray.300"
                height={"3rem"}
                borderColor="gray.300"
                _hover={{borderColor: "gray.500"}}
                _focus={{borderColor: "gray.500"}}
                value={amountRecevied}
                onChange={(e) => setAmountRecevied(e.target.value)}
                variant='flushed'
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.sumbitButton} onClick={() => setIsComponentVisible(!isComponentVisible)}>Submit</button>
            </div>

          </div>
        </div> : null
      }


    </div>
  )
}


export default ActionBlock;
