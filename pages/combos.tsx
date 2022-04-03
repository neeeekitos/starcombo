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
import {useEffect, useState} from "react";
import ActionBlock from "../components/action-block/action-block";
import {Reorder} from "framer-motion"

import styles from "./combos.module.css";
import {Action, ACTIONS, ActionTypes, ProtocolNames, PROTOCOLS} from "../utils/constants/constants";
import Invocations from "../components/Invocations";
import {StarknetConnector, SwapParameters} from "../utils/constants/interfaces";
import {createTokenObjects} from "../utils/helpers";
import {JediSwap} from "../hooks/jediSwap";
import {Pair} from "@jediswap/sdk";
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
  const {transactionItems} = useTransactions();
  const [error, setError] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([])
  const {initialFunds, receivedFunds} = useAmounts()
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
  //TODO theoritical and not working yet
  const send = async () => {
    let error = false
    for (const [key, value] of Object.entries(initialFunds)) {
      //TODO check if its w or w/o decimals
      const userBalance = parseFloat(await getBalanceOfErc20(provider, key))
      if (userBalance < value) {
        NotificationManager.error(`Insufficient ${key} in your wallet`)
        error = true;
      }
    }

    if (!error) {
      const transactions = Object.values(transactionItems);
      console.log(transactions)
      const hash = await account.execute(transactions);
      console.log(hash)
      setTransactionHistory([...transactionHistory, hash]);
    }
  }

  //Render functions
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
        {JSON.stringify(initialFunds)}
        {JSON.stringify(receivedFunds)}
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
                <ActionBlockRemove
                  actionName={ACTIONS[action.actionType].name}
                  protocolName={PROTOCOLS[action.protocolName].name}
                  action={action}
                />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        {
          // TODO replace the droplist by the modal (furucombo example)
        }
        <AddAction
          onAddAction={handleAddAction}
        />
        </div>
        <Button onClick={()=>send()}>Send</Button>

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
