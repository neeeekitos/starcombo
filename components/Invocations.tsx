import {useEffect, useState} from "react";
import {Abi, AccountInterface, AddTransactionResponse, Contract, Provider} from "starknet";
import BalancesAbi from "../contracts/artifacts/abis/balances.json";
import {Button, Flex} from "@chakra-ui/react";


import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json"

import {ethers} from "ethers";
import {JEDI_ROUTER_ADDRESS, JEDI_TOKENS, JEDI_REGISTRY_ADDRESS} from "../constants/contants";
import {ChainId, Fetcher, Pair, Percent, Route, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {MySwap} from "../hooks/mySwap";
import {JediSwap} from "../hooks/jediSwap";
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

    if (!provider || !account) return;

    const amountFrom = "100000000000000000000";
    const amountTo = "3316"; //not necessary anymore for exact_tokens_for_tokens
    const tokenFrom = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c"; //jedifeb0
    const tokenTo = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756"; //jedifeb1
    const tokenFromDec = ethers.BigNumber.from(tokenFrom).toBigInt().toString()
    const tokenToDec = ethers.BigNumber.from(tokenTo).toBigInt().toString()

    const jediSwap:JediSwap = JediSwap.getInstance();
    //Fetches liq pool address for tokenA and tokenB
    const swapResult = await jediSwap.swap(account,provider,tokenFrom,tokenTo,amountFrom,amountTo)

    console.log(`[jediSwap result] : ${swapResult}`);
    setHash(swapResult.transaction_hash);
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
    // const poolInfo = await getPoolInfo(poolNumber); //4 is for test to tUSDC
    //TODO compute output amt here from pool values
    const minOutputAmt = "302379469743"
    const amountIn = (100 * 10 ** 18).toString();
    const tokenToDec = "1244282282488805475571988418073899266274761011798937057331700042103679053837";
    const tokenFromDec = "3267429884791031784129188059026496191501564961518175231747906707757621165072";
    const txSwap = await MySwap.getInstance().swap(account!,provider!,tokenToDec, tokenFromDec, amountIn, "0");
    console.log(`txSwap: ${JSON.stringify(txSwap)}`);
    setHash(txSwap.transaction_hash);
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
