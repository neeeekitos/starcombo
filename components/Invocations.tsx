import {useEffect, useState} from "react";
import {Abi, AccountInterface, AddTransactionResponse, Contract, Provider} from "starknet";
import BalancesAbi from "../contracts/artifacts/abis/balances.json";
import {Button, Flex} from "@chakra-ui/react";


import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json"

import {ethers} from "ethers";
import {JEDI_ROUTER_ADDRESS, JEDI_TOKENS, JEDI_REGISTRY_ADDRESS} from "../utils/constants/constants";
import {ChainId, Fetcher, Pair, Percent, Route, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {MySwap} from "../hooks/mySwap";
import {JediSwap} from "../hooks/jediSwap";
import {useStarknet} from "../hooks/useStarknet";
import {add} from "@noble/hashes/_u64";
import {getErc20Decimals} from "../utils/helpers";
import {LiquidityPoolInputs, StarknetConnector} from "../utils/constants/interfaces";


const Invocations = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();

  const [hash, setHash] = useState<string>();
  const [pair, setPair] = useState<Pair>();

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

    const amountFrom = "100"; //as given by frontend
    const amountTo = "0"; //not necessary anymore for exact_tokens_for_tokens
    const tokenFromAddress = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c"; //jedifeb0
    const tokenToAddress = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756"; //jedifeb1

    const tokenFromDecimals = await getErc20Decimals(provider, tokenFromAddress);
    const tokenToDecimals = await getErc20Decimals(provider, tokenToAddress)

    const token0 = new Token(
      ChainId.GÖRLI,
      tokenFromAddress,
      parseInt(tokenFromDecimals),
    )
    const token1 = new Token(
      ChainId.GÖRLI,
      tokenToAddress,
      parseInt(tokenToDecimals),
    )

    const jediSwap: JediSwap = JediSwap.getInstance();
    const slippage = new Percent('50', '10000'); // 0.5%
    const jediPair = await jediSwap.getPair(provider, token0, token1)
    setPair(jediPair)

    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }

    //Fetches liq pool address for tokenA and tokenB
    const swapTx = await jediSwap.swap(starknetConnector, token0, token1, amountFrom, amountTo, jediPair)
    const txResult = await account.execute(swapTx)
    setHash(txResult.transaction_hash);
  }

  const jediSwapLiq = async () => {

    if (!provider || !account) return;

    const amountToken0 = "100"; //TODO user defined
    const amountToken1 = "0"; //not necessary anymore for exact_tokens_for_tokens
    const token0Address = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c"; //jedifeb0 //TODO user defined
    const token1Address = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756"; //jedifeb1
    const token0Decimals = await getErc20Decimals(provider, token0Address);
    const token1Decimals = await getErc20Decimals(provider, token1Address)
    //TODO user defined
    const slippage = new Percent("50", "10000");
    //careful about decimals here, they must be adapted to the chosen token -> call erc20 contract to get decimals
    const token0 = new Token(
      ChainId.GÖRLI,
      token0Address,
      parseInt(token0Decimals),
    )
    const token1 = new Token(
      ChainId.GÖRLI,
      token1Address,
      parseInt(token1Decimals),
    )
    const jediSwap: JediSwap = JediSwap.getInstance();
    const pair = await jediSwap.getPair(provider, token0, token1)
    //TODO save pool in state

    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }

    const addLiquidityTx = await jediSwap.addLiquidity(starknetConnector, pair, slippage, amountToken0)
    const hash = await account.execute(addLiquidityTx);
    console.log(`[jediSwap liq result] : ${hash}`);
  }

  const mySwap = async () => {
    //TODO use right values here for the swap
    //TODO calculate output of swap and use it as transaction value

    const amountIn = "100" //as specified by frontend
    const tokenFromAddress = "0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10"
    const tokenToAddress = "0x02c03d22f43898f146e026a72f4cf37b9e898b70a11c4731665e0d75ce87700d";

    const tokenFromDecimals = await getErc20Decimals(provider, tokenFromAddress);
    const tokenToDecimals = await getErc20Decimals(provider, tokenToAddress)

    const tokenFrom = new Token(
      ChainId.GÖRLI,
      tokenFromAddress,
      parseInt(tokenFromDecimals),
    )
    const tokenTo = new Token(
      ChainId.GÖRLI,
      tokenToAddress,
      parseInt(tokenToDecimals),
    )

    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }

    const {poolId, poolPair} = await MySwap.getInstance().getPoolDetails(tokenFrom, tokenTo);
    console.log(poolPair.token0Price.raw.toSignificant(6))
    console.log(poolPair.token1Price.raw.toSignificant(6))

    const txSwap = await MySwap.getInstance().swap(starknetConnector, tokenFrom, tokenTo, amountIn, "0", poolPair,poolId);
    const hash = await account.execute(txSwap);
    console.log(`txSwap: ${JSON.stringify(hash)}`);
    setHash(hash.transaction_hash);
  }


  return (
    <Flex
      marginTop={"50px"}>
      <Button onClick={() => mySwap()}>mySwap</Button>
      <Button onClick={() => jediSwap()}>jediSwap</Button>
      {pair && <div>
        {`${pair.token0Price.raw.toSignificant(6)} token0 = ${pair.token1Price.raw.toSignificant(6)}`}
      </div>}
      <Button onClick={() => jediSwapLiq()}>jediswapLiquidity</Button>


      {hash && <div>
        {hash}
      </div>}
    </Flex>
  )

}

export default Invocations;
