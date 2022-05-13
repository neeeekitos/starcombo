import {NextPage} from "next";
import {useStarknet} from "../hooks/useStarknet";

import {Button, Flex, Icon} from "@chakra-ui/react"
import React, {useRef, useState} from "react";
import {Reorder} from "framer-motion"

import styles from "./combos.module.css";
import {Action, ACTIONS, ActionTypes, PROTOCOLS} from "../utils/constants/constants";
import {StarknetConnector} from "../utils/constants/interfaces";
import {getBalanceOfErc20, getFloatFromBN} from "../utils/helpers";
import {Token} from "@jediswap/sdk";
import {useAmounts} from "../hooks/useAmounts";
import {NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';

import {useTransactions} from "../hooks/useTransactions";

import FundsRecap from "../components/FundsRecap";
import SelectNewAction from "../components/select-new-action/select-new-action";

import useComponentVisible from "../hooks/UseComponentVisible";
import Swap from "../components/swapv2/swap";
import Add from "../components/addv2/Add";
import Remove from "../components/removev2/Remove";
import {BsPlusCircle} from "react-icons/bs";

const Combos: NextPage = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();
  const starknetConnector: StarknetConnector = {
    account: account,
    provider: provider
  }
  const {
    transactionItems,
    addTransactionHistory,
    removeTransaction,
    reorderTransactions,
    orderedTransactionData
  } = useTransactions();
  const {initialFunds, receivedFunds, tokenInfos, removeItem, reorderAmounts} = useAmounts();
  const [actions, setActions] = useState<Action[]>([]);


  const {ref, isComponentVisible, setIsComponentVisible} = useComponentVisible(false);

  const footerRef = useRef(null);

  const scrollToBottom = () => {
    footerRef.current?.scrollIntoView({behavior: "smooth"})
  }

  //When reordering, reorderAmounts from
  const handleReorder = (newOrder) => {
    reorderAmounts(newOrder);
    reorderTransactions(newOrder);
    setActions(newOrder);
  }

  const handleAddAction = (action: Action) => {
    reorderAmounts([...actions, action]);
    reorderTransactions([...actions, action]);
    setActions([...actions, action]);
    scrollToBottom()
  }

  const handleRemoveAction = (actionId: number) => {
    setActions(actions.filter(a => a.id !== actionId))
    removeItem(actionId);
    removeTransaction(actionId)
  }

  const walletConnection = async () => {
    const error = await connectWallet()
    if (error) NotificationManager.error(error);
    if (!error) NotificationManager.success('Connected');
  }


  /**
   * Sends the transactions. Verifies is the user has the initial funds required.
   */
  const send = async () => {
    try {
      let error = false;
      for (const [key, value] of Object.entries(initialFunds)) {
        const token: Token = tokenInfos[key]
        //TODO check if its w or w/o decimals\
        const userBalanceBN = await getBalanceOfErc20(starknetConnector, token)
        const userBalance = getFloatFromBN(userBalanceBN.toString(), token.decimals);
        if (userBalance < value) {
          NotificationManager.error(`Insufficient ${key} in your wallet`)
          error = true;
        }
      }

      if (!error) {
        const transactions = orderedTransactionData
        const tx_data = await account.execute(transactions);
        NotificationManager.success("Transaction Sent!", 'Transaction sent', 5000, () => window.open(`https://goerli.voyager.online/tx/${tx_data.transaction_hash}`));
        addTransactionHistory(tx_data.transaction_hash);
      }
    } catch (err) {
      NotificationManager.error("There was an error when sending the transaction", 'Error')
    }
  }

  //Render functions
  const renderCorrespondingActionBlock = (action) => {
    const actionBlocks = {
      [ActionTypes.ADD_LIQUIDITY]: Add,
      [ActionTypes.REMOVE_LIQUIDITY]: Remove,
      [ActionTypes.SWAP]: Swap,
    }
    let Component = actionBlocks[action.actionType];
    return (
      <Component
        actionName={ACTIONS[action.actionType].name}
        protocolName={PROTOCOLS[action.protocolName].name}
        action={action}
        handleRemoveAction={handleRemoveAction}
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
            _hover={{bg: "brand.body"}}
            _active={{bg: "brand.navbar"}}
            onClick={() => walletConnection()}>Connect Wallet to start</Button>
        </Flex>
      </div>
    )
  }
  const renderConnected = () => {
    return (
      <div className={styles.container}>
        <FundsRecap/>
        <div className={styles.container}>

          {
            isComponentVisible &&
            <div ref={ref}>
              <SelectNewAction setIsComponentVisible={setIsComponentVisible} newId={actions.length}
                               onAddAction={handleAddAction}/>
            </div>
          }

          <Reorder.Group
            as="ul"
            className={styles.actionsWrapper}
            axis="y"
            values={actions}
            onReorder={(newOrder) => {
              handleReorder(newOrder);
            }}
            layoutScroll
            style={{overflowY: "hidden"}}
          >
            {actions.map((action) => (
              <Reorder.Item key={action.id} value={action}>
                <div className={styles.blockWrapper}>
                  {renderCorrespondingActionBlock(action)}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

        </div>
        <Button
          w={10} h={10}
          variant={'unstyled'}
          onClick={() => setIsComponentVisible(true)}
          hidden={isComponentVisible}
        >
          <Icon w={10} h={10} as={BsPlusCircle} _active={{bg: "brand.navbar"}}

          />
        </Button>

        <Button
          background="brand.body"
          _hover={{bg: "brand.body"}}
          _active={{bg: "brand.navbar"}}
          onClick={() => send()}
          hidden={Object.keys(transactionItems).length === 0}
          marginTop={'30px'}
        >
          Send
        </Button>

        <footer ref={footerRef}/>
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
