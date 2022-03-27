import {NextPage} from "next";
import {useStarknet} from "../hooks/useStarknet";

import {Button, Flex, Heading} from "@chakra-ui/react"
import {Abi, AccountInterface, AddTransactionResponse, Contract} from 'starknet'
import {toBN} from 'starknet/utils/number'

import BalancesAbi from '../contracts/artifacts/abis/balances.json'
import {defaultProvider, ec, hash} from "starknet/src/index";
import {transformCallsToMulticallArrays} from "starknet/src/utils/transaction";
import {getStarknet} from "@argent/get-starknet";
import {StarknetWindowObject} from "@argent/get-starknet/dist/extension.model";
import {useEffect, useState} from "react";
import ActionBlock from "../components/action-block";
import {Reorder} from "framer-motion"

import styles from "./combos.module.css";
import {ACTIONS, ActionTypes, ProtocolNames, PROTOCOLS} from "../utils/constants/contants";
import Invocations from "../components/Invocations";


const Combos: NextPage = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();
  const [items, setItems] = useState([0, 1, 2, 3])


  const renderDisconnected = () => {
    return (
      <Flex
        marginTop={"50px"}>
        Connect your Wallet to start
        <Button onClick={() => connectWallet()}>Connect Wallet</Button>
      </Flex>
    )
  }


  const renderConnected = () => {
    return (
      <div className={styles.container}>
        <Invocations/>


        <Reorder.Group
          as="ul"
          className={styles.actionsWrapper}
          axis="x"
          values={items}
          onReorder={setItems}
          layoutScroll
          style={{overflowX: "scroll"}}
        >
          {items.map((item) => (
            <Reorder.Item key={item} value={item}>
              <div className={styles.blockWrapper}>
                <ActionBlock
                  actionName={ACTIONS[ActionTypes.SWAP].name}
                  protocolName={PROTOCOLS[ProtocolNames.JEDISWAP].name}
                  item={item}
                />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

    )
  }

  return (
    <>
      {account && renderConnected()}
      {!account && renderDisconnected()}
    </>
  )

}
export default Combos;
