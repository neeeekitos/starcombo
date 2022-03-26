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
import ActionBlock from "./action-block";

import styles from "./combos.module.css";
import {ACTIONS, ActionTypes, ProtocolNames, PROTOCOLS} from "../constants/contants";
import Invocations from "../components/Invocations";



const Combos: NextPage = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();

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
        <div className={styles.blockWrapper}>

          <ActionBlock
            action={ACTIONS[ActionTypes.SWAP]}
            protocol={PROTOCOLS[ProtocolNames.JEDISWAP]}
          />

          <ActionBlock
            action={ACTIONS[ActionTypes.ADD_LIQUIDITY]}
            protocol={PROTOCOLS[ProtocolNames.AAVE]}
          />
        </div>
      </div>

    )
  }

  return(
    <>
      {account && renderConnected()}
      {!account && renderDisconnected()}
    </>
  )

}
export default Combos;
