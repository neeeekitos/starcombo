import {useEffect, useState} from "react";
import {Abi, AccountInterface, AddTransactionResponse, Contract} from "starknet";
import {Button, Flex} from "@chakra-ui/react";


import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json"
import ERC20Abi from "../contracts/artifacts/abis/ERC20_Mintable.json";

import {ethers} from "ethers";
import {JEDI_ROUTER_ADDRESS, JEDI_TOKENS} from "../constants/contants";
import {useStarknet} from "../hooks/useStarknet";


const getPoolInfo = async (poolNumber: string) => {
  const mySwapRouterContract = new Contract(mySwapRouter.abi as Abi, "0x071faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e");
  return await mySwapRouterContract.call("get_pool", [poolNumber]);

}
const Invocations = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();

  const [hash, setHash] = useState<string>();


  const jediMint = async () => {
    // example of minting tokens
    // [
    //   {
    //     "contractAddress": "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c",
    //     "entrypoint": "mint",
    //     "calldata": [
    //       "2798193459390376008727001279081998466241421508748572511158283351255833300357",
    //       "1000000000000000000000",
    //       "0"
    //     ]
    //   },
    //   {
    //     "contractAddress": "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756",
    //     "entrypoint": "mint",
    //     "calldata": [
    //       "2798193459390376008727001279081998466241421508748572511158283351255833300357",
    //       "1000000000",
    //       "0"
    //     ]
    //   },

    const txs = JEDI_TOKENS.map(token => (
      {
        contractAddress: token.address,
        entrypoint: 'mint',
        calldata: [
          "2798193459390376008727001279081998466241421508748572511158283351255833300357",
          "1000000000000000000000",
          "0"
        ]
      }
    ));
    const result = await account!.execute(txs);
    setHash(result.transaction_hash);
  }

  const jediSwap = async () => {
    // example of swapping tokens on jedi swap
    // [
    //   {
    //     "contractAddress": "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c",
    //     "entrypoint": "approve",
    //     "calldata": [
    //       "866079946690358847859985129991514658898248253189226492476287621475869744734",
    //       "1000000000000000000",
    //       "0"
    //     ]
    //   },
    //   {
    //     "contractAddress": "0x01ea2f12a70ad6a052f99a49dace349996a8e968a0d6d4e9ec34e0991e6d5e5e",
    //     "entrypoint": "swap_exact_tokens_for_tokens",
    //     "calldata": [
    //       "1000000000000000000",
    //       "0",
    //       "3324",
    //       "0",
    //       "2",
    //       "2142376297555024307137040930023258799355699005255497903690441922440230523500",
    //       "2692716159122393784616706728158140843871764933665233947930296785143367321430",
    //       "2798193459390376008727001279081998466241421508748572511158283351255833300357",
    //       "1648216380"
    //     ]
    //   }
    // ]
    const amountFrom = "1000000000000000000";
    const amountTo = "3316";
    const tokenFrom = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c";
    const tokenTo = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756";
    const receiver = account!.address;
    console.log(`receiver: ${receiver}`);
    console.log(Math.floor(Date.now() / 1000));
    const tx = [
      {
        contractAddress: tokenFrom,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(JEDI_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          amountFrom,
          "0"
        ]
      },
      {
        contractAddress: JEDI_ROUTER_ADDRESS,
        entrypoint: 'swap_exact_tokens_for_tokens',
        calldata: [
          amountFrom,
          "0",
          amountTo,
          "0",
          "2",
          ethers.BigNumber.from(tokenFrom).toBigInt().toString(),
          ethers.BigNumber.from(tokenTo).toBigInt().toString(),
          ethers.BigNumber.from(receiver).toBigInt().toString(),
          Math.floor((Date.now() / 1000) + 3600) // default timeout is 1 hour
        ]
      }
    ];
    const result = await account!.execute(tx);
    console.log(`[jediSwap result] : ${result}`);
    setHash(result.transaction_hash);
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

    const testErc20Adress = "0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10"
    const testErc20Dec = ethers.BigNumber.from(testErc20Adress).toBigInt().toString()
    const poolNumber = "4";
    const poolInfo = await getPoolInfo(poolNumber); //4 is for test to tUSDC
    //TODO compute output amt here from pool values
    const minOutputAmt = "302379469743"
    const tokenAmt = (100 * 10 ** 18).toString();
    try {
      const transac: AddTransactionResponse = await account!.execute(
            [
              {
                contractAddress: testErc20Adress, //address for test token
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
                  testErc20Dec,
                  tokenAmt,
                  "0",
                  minOutputAmt,
                  "0"
                ]
              }
            ],
      )
      setHash(transac.transaction_hash);
    } catch (e) {
      console.log(e);
    }
  }




  return (
    <Flex
      marginTop={"50px"}>
      <Button onClick={() => mySwap()}>mySwap</Button>
      <Button onClick={() => jediSwap()}>jediSwap</Button>

      {hash && <div>
        {hash}
      </div>}
    </Flex>
  )

}

export default Invocations;
