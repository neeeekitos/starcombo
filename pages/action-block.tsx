import styles from "./action-block.module.css";
import {Input} from "@chakra-ui/input";
// @ts-ignore
import {Btc, Usdt} from 'react-cryptocoins';
import TokenChooser from "../components/token-chooser";
import {ArrowDownIcon} from "@chakra-ui/icons";
import {SELECTABLE_TOKENS} from "../constants/contants";
import {useEffect, useState} from "react";
import {motion, useMotionValue} from "framer-motion"

const ActionBlock = (props: any) => {

  const x = useMotionValue(0);
  const xPositions = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  const [xPos, setXPos] = useState(x);

  const [selectedTokenFrom, setSelectedTokenFrom] = useState(SELECTABLE_TOKENS[0]);
  const [selectedTokenTo, setSelectedTokenTo] = useState(SELECTABLE_TOKENS[1]);

  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");

  useEffect(() => {

  }, [x]);

  return (
    // <motion.div
    //   drag
    //   whileHover={{ scale: 1.05 }}
    //   animate={{
    //     x: 100
    //   }}
    //   dragDirectionLock
    //   dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
    //   dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
    //   dragElastic={0.5}
    //   whileTap={{ cursor: "grabbing" }}
    // >
      <div className={styles.block}>
        <div className={styles.actionNameWrapper}>
          <h3 className={styles.actionName}>{props.action.name}</h3>
        </div>
        <p className={styles.protocolName}>{props.protocol.name}</p>

        <div className={styles.actionInputsWrapper}>
          <div className={styles.actionInputField}>
            <TokenChooser
              selectedToken={selectedTokenFrom}
              setSelectedToken={setSelectedTokenFrom}
              selectableTokens={SELECTABLE_TOKENS}
            />
            <Input
              placeholder="Input amount"
              color="gray.300"
              height={"3rem"}
              borderRadius="md"
              borderColor="gray.300"
              _hover={{borderColor: "gray.500"}}
              _focus={{borderColor: "gray.500"}}
              value={amountFrom}
              onChange={(e) => setAmountFrom(e.target.value)}
            />
          </div>
          <ArrowDownIcon w={10} h={10} color={"#fff"}/>

          <div className={styles.actionInputField}>
            <TokenChooser
              selectedToken={selectedTokenTo}
              setSelectedToken={setSelectedTokenTo}
              selectableTokens={SELECTABLE_TOKENS}
            />
            <Input
              placeholder="Output amount"
              color="gray.300"
              height={"3rem"}
              borderRadius="md"
              borderColor="gray.300"
              _hover={{borderColor: "gray.500"}}
              _focus={{borderColor: "gray.500"}}
              value={amountTo}
              onChange={(e: any) => setAmountTo(e.target.value)}
            />
          </div>
        </div>
      </div>
    // </motion.div>
  )
}
export default ActionBlock;
