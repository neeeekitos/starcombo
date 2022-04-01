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


const Combos: NextPage = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();
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

  // useEffect(() => {
  //   if (account) {
  //     jediSwap().then(txAction => {
  //       console.log(`Jedi Swap: ${txAction} actions`)
  //       handleAddAction(txAction)
  //     });
  //   } else {
  //     setActions([]);
  //   }
  // }, [account]);

  const jediSwap = async () => {

    if (!provider || !account) return;

    const amountFrom = "100"; //as given by frontend
    const amountTo = "0"; //not necessary anymore for exact_tokens_for_tokens
    const tokenFromAddress = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c"; //jedifeb0
    const tokenToAddress = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756"; //jedifeb1
    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }
    const {tokenFrom, tokenTo} = await createTokenObjects(starknetConnector, tokenFromAddress, tokenToAddress);
    const jediSwap: JediSwap = JediSwap.getInstance();
    const jediPair = await jediSwap.getPair(provider, tokenFrom, tokenTo)
    setPair(jediPair)

    const swapParameters: SwapParameters = {
      tokenFrom: tokenFrom,
      tokenTo: tokenTo,
      amountIn: amountFrom,
      amountOut: amountTo,
      poolPair: jediPair
    }
    const swapTx = await jediSwap.swap(starknetConnector, swapParameters)
    // const txResult = await account.execute(swapTx)
    // setHash(txResult.transaction_hash);
    return swapTx;
  }

  const {initialFunds,receivedFunds} = useAmounts()


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
                <ActionBlock
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
