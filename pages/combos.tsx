import {NextPage} from "next";
import {useStarknet} from "../hooks/useStarknet";

import {Button, Flex, Heading, MenuItem} from "@chakra-ui/react"
import {Abi, AccountInterface, AddTransactionResponse, Contract} from 'starknet'
import {toBN} from 'starknet/utils/number'

import BalancesAbi from '../contracts/artifacts/abis/balances.json'
import {defaultProvider, ec, hash} from "starknet/src/index";
import {transformCallsToMulticallArrays} from "starknet/src/utils/transaction";
import {getStarknet} from "@argent/get-starknet";
import {StarknetWindowObject} from "@argent/get-starknet/dist/extension.model";
import React, {useEffect, useState} from "react";
import ActionBlockSwap from "../components/action-block-swap/action-block-swap";
import {Reorder} from "framer-motion"

import styles from "./combos.module.css";
import {Action, ACTIONS, ActionTypes, ProtocolNames, PROTOCOLS} from "../utils/constants/constants";
import Invocations from "../components/Invocations";
import {StarknetConnector, SwapParameters} from "../utils/constants/interfaces";
import {createTokenObjects} from "../utils/helpers";
import {JediSwap} from "../hooks/jediSwap";
import {Pair, Token} from "@jediswap/sdk";
import alert from "@chakra-ui/theme/src/components/alert";
import AddAction from "../hooks/AddAction";
import {useAmounts} from "../hooks/useAmounts";
import {getBalanceOfErc20} from "../utils/helpers";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import {useTransactions} from "../hooks/useTransactions";

import ActionBlockAdd from "../components/action-block-add/action-block-add";
import ActionBlockRemove from "../components/action-block-remove/action-block-remove";


const Combos: NextPage = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();
  const starknetConnector: StarknetConnector = {
    account: account,
    provider: provider
  }
  const {transactionItems, transactionHistory, addTransactionHistory} = useTransactions();
  const [error, setError] = useState(false);
  const {initialFunds, receivedFunds, tokenInfos} = useAmounts()
  const [actions, setActions] = useState<Action[]>([]);

  const [hash, setHash] = useState<string>();
  const [pair, setPair] = useState<Pair>();

  const handleAddAction = (action: Action) => {
    console.log(`Adding action: ${JSON.stringify(action)}`);
    setActions([...actions, action]);
  }

  const handleRemoveAction = (action: Action) => {
    setActions(actions.filter(a => a.id !== action.id))
  }

  /**
   * Sends the transactions. Verifies is the user has the initial funds required.
   */
  const send = async () => {
    console.log(transactionItems)
    let error = false;
    for (const [key, value] of Object.entries(initialFunds)) {
      const token: Token = tokenInfos[key]
      //TODO check if its w or w/o decimals\
      const userBalance = parseFloat(await getBalanceOfErc20(starknetConnector, token))
      if (userBalance < value) {
        NotificationManager.error(`Insufficient ${key} in your wallet`)
        error = true;
      }
    }

    if (!error) {
      const transactions = Object.values(transactionItems).flat();
      console.log(transactions)
      const tx_data = await account.execute(transactions);
      console.log(tx_data)
      addTransactionHistory(tx_data.transaction_hash);
      console.log(hash)
    }
  }

  //Render functions
  const renderCorrespondingActionBlock = (action) => {
    const actionBlocks = {
      [ActionTypes.ADD_LIQUIDITY]: ActionBlockAdd,
      [ActionTypes.REMOVE_LIQUIDITY]: ActionBlockRemove,
      [ActionTypes.SWAP]: ActionBlockSwap
    }
    let Component = actionBlocks[action.actionType];
    return (
      <Component
        actionName={ACTIONS[action.actionType].name}
        protocolName={PROTOCOLS[action.protocolName].name}
        action={action}
      />
    )
  }

  const renderDisconnected = () => {
    return (
      <div className={styles.notConnectedWrapper}>
        <Flex
          justifyContent={'center'}
          flexDirection={'column'}
          >
          <Button
            background="transparent"
            _hover={{ bg: "brand.body"}}
            _active={ { bg: "brand.navbar" } }
            onClick={() => connectWallet()}>Connect Wallet to start</Button>
        </Flex>
      </div>
    )
  }
  const renderConnected = () => {
    console.log(actions)
    return (
      <div className={styles.container}>
        {JSON.stringify(initialFunds)}
        {JSON.stringify(receivedFunds)}
        {JSON.stringify(transactionHistory)}

        <Invocations/>


        <div className={styles.container}>
          <Reorder.Group
            as="ul"
            className={styles.actionsWrapper}
            axis="y"
            values={actions}
            onReorder={setActions}
            layoutScroll
            style={{overflowY: "scroll"}}
          >
            {actions.map((action) => (
              <Reorder.Item key={action.id} value={action}>
                <div className={styles.blockWrapper}>
                  {renderCorrespondingActionBlock(action)}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {
            // TODO replace the droplist by the modal (furucombo example)
          }
          <AddAction
            newId={actions.length}
            onAddAction={handleAddAction}
          />
        </div>
        <Button onClick={() => send()}>Send</Button>

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
