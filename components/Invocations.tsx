import {useEffect, useState} from "react";
import {Abi, AccountInterface, AddTransactionResponse, Contract} from "starknet";
import BalancesAbi from "../contracts/artifacts/abis/balances.json";
import {Button, Flex} from "@chakra-ui/react";
import {COUNTER_ADDRESS} from "../pages/combos";
import {getStarknet} from "@argent/get-starknet/dist";


import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json"


const getPoolInfo = async (poolNumber: string) => {
  const mySwapRouterContract = new Contract(mySwapRouter.abi as Abi, "0x071faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e");
  return await mySwapRouterContract.call("get_pool", [poolNumber]);

}
const Invocations = () => {

  const [acc, setAcc] = useState<AccountInterface>();
  const [hash, setHash] = useState<string>();
  useEffect(() => {

    setup();

  }, [])

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

  const mySwap = async () => {
    //TODO use right values here for the swap
    //TODO calculate output of swap and use it as transaction value

    //EXAMPLE for approve plus swap
    //   [
    //   {
    //     "contractAddress": "0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10", //address for test token
    //     "entrypoint": "approve",
    //     "calldata": [
    //       "3222138877362455837336203414511899549532510795732583806035105711862644221454",
    //       "100000000000000000000",
    //       "0"
    //     ]
    //   },
    //     {
    //       "contractAddress": "0x71faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e",
    //       "entrypoint": "swap",
    //       "calldata": [
    //         "4", pool id
    //         "3267429884791031784129188059026496191501564961518175231747906707757621165072", token to swap
    //         "100000000000000000000", min amt to swap
    //         "0", max
    //         "302379469743", min output
    //         "0" max
    //       ]
    //     }
    //   ]

    const poolNumber = "4";
    const poolInfo = await getPoolInfo(poolNumber); //4 is for test to tUSDC
    //TODO compute output amt here from pool values
    const minOutputAmt ="302379469743"
    const tokenAmt = (100 * 10**18).toString();
    try {
      const transac: AddTransactionResponse = await acc!.execute(
        [
          {
            contractAddress: "0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10", //address for test token
            entrypoint: "approve",
            calldata: [
              "3222138877362455837336203414511899549532510795732583806035105711862644221454",
              tokenAmt,
              "0"
            ]
          },
          {
            contractAddress: "0x71faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e",
            entrypoint: "swap",
            calldata: [
              poolNumber,
              "0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10",
              tokenAmt,
              "0",
              minOutputAmt,
              "0"
            ]
          }
        ],
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
      <Button onClick={() => makeTransaction()}>update balance</Button>
      <Button onClick={() => mySwap()}>mySwap</Button>

      {hash && <div>
        {hash}
      </div>}
    </Flex>
  )

}

export default Invocations;
