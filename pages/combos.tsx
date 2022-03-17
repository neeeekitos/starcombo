import {NextPage} from "next";
import {
  StarknetProvider,
  useContract,
  useStarknetBlock,
  useStarknetCall,
  useStarknetInvoke,
  useStarknetTransactionManager,
  Transaction,
  useStarknet,
  InjectedConnector,
} from '@starknet-react/core'

import {Button, Flex, Heading} from "@chakra-ui/react"
import {Abi, AccountInterface, AddTransactionResponse, Contract} from 'starknet'
import {toBN} from 'starknet/utils/number'

import BalancesAbi from '../contracts/balances.json'
import {defaultProvider, ec, hash} from "starknet/src/index";
import {transformCallsToMulticallArrays} from "starknet/src/utils/transaction";
import {getStarknet} from "@argent/get-starknet";
import {StarknetWindowObject} from "@argent/get-starknet/dist/extension.model";
import {useEffect, useState} from "react";

export const COUNTER_ADDRESS = '0x04d57c28ba8985ce952e5346bb0a63f64f8ac23884d341d2273ffbeeaf74c68b'

function useBalanceContract() {
  return useContract({abi: BalancesAbi as Abi, address: COUNTER_ADDRESS})
}

function DemoContractCall() {
  const {contract} = useBalanceContract()
  const {data: balance, error} = useStarknetCall({
    contract: contract,
    method: 'get_balance',
    args: [],
  })

  console.log(balance)

  return (
    <Flex
      marginTop={"50px"}
      flexDir={"column"}
    >
      <Heading> Contract Call</Heading>
      {balance ? (
        <div>
          <p>Contract Balance : {toBN(balance[0]).toString()}</p>
        </div>
      ) : error ? (
        <p>'Error loading counter'</p>
      ) : (
        <p>'Loading'</p>
      )}
    </Flex>
  )
}

function DemoContractInvoke() {
  const {contract} = useBalanceContract()
  // Use type parameter to enforce type and number of arguments
  const {data, loading, error, reset, invoke} = useStarknetInvoke<[]>({
    contract,
    method: 'increase_balance',
  })


  return (
    <Flex
      marginTop={"50px"}
      flexDir={"column"}
    >
      <Heading>Invoke Contract Method</Heading>
      <div>
        {data && (
          <div>
            <p>Transaction Hash: {data}</p>
          </div>
        )}
      </div>
      <div>
        <p>Submitting: {loading ? 'Submitting' : 'Not Submitting'}</p>
        <p>Error: {error || 'No error'}</p>
      </div>
      <div>
        <Button onClick={() => invoke({args: []})}>Invoke Method</Button>
        <Button onClick={() => reset()}>Reset State</Button>
      </div>
    </Flex>
  )
}

const MulticallTest = () => {

  const [acc, setAcc] = useState<AccountInterface>();
  const [hash, setHash] = useState<string>();
  useEffect(() => {

    setup();

  }, [])
  const contract = useBalanceContract();

  const setup = async () => {
    const starknet = getStarknet();
    await starknet.enable();
    if (starknet.isConnected === false) {
    }
    console.log(starknet)
    const account = starknet.account;
    console.log(account);
    if (account) setAcc(account);

  }

  const makeTransaction = async () => {
    console.log(acc)
    try {
      const transac: AddTransactionResponse = await acc!.execute(
        [
          {
            contractAddress: COUNTER_ADDRESS,
            entrypoint: 'increase_balance'
          },
          {
            contractAddress: COUNTER_ADDRESS,
            entrypoint: 'increase_balance'
          },
          {
            contractAddress: COUNTER_ADDRESS,
            entrypoint: 'increase_balance'
          },
          {
            contractAddress: COUNTER_ADDRESS,
            entrypoint: 'increase_balance'
          }
        ],
        [BalancesAbi as Abi, BalancesAbi as Abi, BalancesAbi as Abi, BalancesAbi as Abi]
      )
      console.log(transac);
      setHash(transac.transaction_hash);
    } catch (e) {
      console.log(e);
    }
  }


  return (
    <Flex
      marginTop={"50px"}>
      <Button onClick={() => makeTransaction()}>Make Transaction</Button>
      {hash && <div>
        {hash}
      </div>}
    </Flex>
  )

}

function DemoAccount() {
  const {account, connect} = useStarknet()
  return (
    <Flex
      marginTop={"50px"}
      flexDir={"column"}
    >
      <Heading>Account</Heading>
      <div>
        <p>Connected Account: {account}</p>
      </div>
      {InjectedConnector.ready ? (
        <div>
          <Button onClick={() => connect(new InjectedConnector())}>Connect Argent-X</Button>
        </div>
      ) : (
        <div>
          <p>
            <a href="https://github.com/argentlabs/argent-x">Download Argent-X</a>
          </p>
        </div>
      )}
    </Flex>
  )
}

const Combos: NextPage = () => {

  return (
    <Flex
      alignItems={"center"}
      flexDir={"column"}

    >
      <DemoAccount/>
      <DemoContractCall/>
      <DemoContractInvoke/>
      <MulticallTest/>
    </Flex>
  )
}

export default Combos