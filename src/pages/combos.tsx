import {NextPage} from "next";
import {useStarknet} from "../hooks/useStarknet";

import {Button, Flex} from "@chakra-ui/react"
import React, {useState, useRef} from "react";
import ActionBlockSwap from "../components/action-block-swap/action-block-swap";
import {Reorder} from "framer-motion"

import styles from "./combos.module.css";
import {Action, ACTIONS, ActionTypes, PROTOCOLS} from "../utils/constants/constants";
import {StarknetConnector} from "../utils/constants/interfaces";
import {getFloatFromBN} from "../utils/helpers";
import {Pair, Token} from "@jediswap/sdk";
import {useAmounts} from "../hooks/useAmounts";
import {getBalanceOfErc20} from "../utils/helpers";
import {NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';

import {useTransactions} from "../hooks/useTransactions";

import ActionBlockAdd from "../components/action-block-add/action-block-add";
import ActionBlockRemove from "../components/action-block-remove/action-block-remove";
import FundsRecap from "../components/FundsRecap";
import SelectNewAction from "../components/select-new-action/select-new-action";

import useComponentVisible from "../hooks/UseComponentVisible";
import Swap from "../components/swapv2/swap";

const Combos: NextPage = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();
  const starknetConnector: StarknetConnector = {
    account: account,
    provider: provider
  }
  const {
    transactionItems,
    transactionHistory,
    addTransactionHistory,
    removeTransaction,
    reorderTransactions,
    orderedTransactionData
  } = useTransactions();
  const [error, setError] = useState(false);
  const {initialFunds, receivedFunds, tokenInfos, removeItem, reorderAmounts} = useAmounts();
  const [actions, setActions] = useState<Action[]>([]);

  const [moved, setMoved] = useState<boolean>(false);

  const [hash, setHash] = useState<string>();
  const [pair, setPair] = useState<Pair>();

  const {ref, isComponentVisible, setIsComponentVisible} = useComponentVisible(false);

  const [openNewActionModal, setOpenNewActionModal] = useState<boolean>(false);
  const footerRef = useRef(null);

  const scrollToBottom = () => {
    footerRef.current?.scrollIntoView({behavior: "smooth"})
  }

  // useEffect(() => {
  //   // scrollToBottom()
  //   console.log(actions)
  // }, [actions]);

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
        console.log(transactions)
        const tx_data = await account.execute(transactions);
        console.log(tx_data)
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
      [ActionTypes.ADD_LIQUIDITY]: ActionBlockAdd,
      [ActionTypes.REMOVE_LIQUIDITY]: ActionBlockRemove,
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

          <Button
            background="brand.body"
            _hover={{bg: "brand.body"}}
            _active={{bg: "brand.navbar"}}
            onClick={() => setIsComponentVisible(true)}
            hidden={isComponentVisible}
          >
            Add action
          </Button>
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
          background="brand.body"
          _hover={{bg: "brand.body"}}
          _active={{bg: "brand.navbar"}}
          onClick={() => send()}
          hidden={Object.keys(transactionItems).length === 0}
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
