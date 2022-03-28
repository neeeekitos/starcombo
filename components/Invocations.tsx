import {useEffect, useState} from "react";
import {Abi, AccountInterface, AddTransactionResponse, Contract, number, Provider} from "starknet";
import BalancesAbi from "../contracts/artifacts/abis/balances.json";
import {Button, Flex} from "@chakra-ui/react";


import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json"

import {ethers} from "ethers";
import {JEDI_ROUTER_ADDRESS, JEDI_TOKENS, JEDI_REGISTRY_ADDRESS, SLIPPAGE} from "../utils/constants/constants";
import {ChainId, Fetcher, Pair, Percent, Route, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {MySwap} from "../hooks/mySwap";
import {JediSwap} from "../hooks/jediSwap";
import {useStarknet} from "../hooks/useStarknet";
import {add} from "@noble/hashes/_u64";
import {createTokenObjects, getErc20Decimals} from "../utils/helpers";
import {LiquidityPoolInputs, StarknetConnector, SwapParameters} from "../utils/constants/interfaces";


const Invocations = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();

  const [hash, setHash] = useState<string>();
  const [pair, setPair] = useState<Pair>();

  const jediMint = async () => {
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
    const txResult = await account.execute(swapTx)
    setHash(txResult.transaction_hash);
  }

  const jediSwapLiq = async () => {

    if (!provider || !account) return;

    let amountTokenFrom = "100"; //TODO user defined
    const amountToken1 = "0"; //not necessary anymore for exact_tokens_for_tokens
    const token0Address = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c"; //jedifeb0 //TODO user defined
    const token1Address = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756"; //jedifeb1
    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }
    const {tokenFrom, tokenTo} = await createTokenObjects(starknetConnector, token0Address, token1Address);
    const jediSwap: JediSwap = JediSwap.getInstance();
    const poolPair = await jediSwap.getPair(provider, tokenFrom, tokenTo)
    //TODO save pool prices in state
    amountTokenFrom = ethers.utils.parseUnits(amountTokenFrom, tokenFrom.decimals).toString()
    const tokenAmountFrom = new TokenAmount(tokenFrom, amountTokenFrom)
    const addLiquidityTx = await jediSwap.addLiquidity(starknetConnector, poolPair, SLIPPAGE, tokenAmountFrom)
    const hash = await account.execute(addLiquidityTx);
    console.log(`[jediSwap liq result] : ${hash}`);
  }

  const mySwap = async () => {
    //TODO use right values here for the swap
    const amountIn = "100" //as specified by frontend
    const tokenFromAddress = "0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10"
    const tokenToAddress = "0x044e592375a34fb4fdd3a5e2694cd2cbbcd61305b95cfac9d40c1f02ac64aa66";
    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }
    const {tokenFrom, tokenTo} = await createTokenObjects(starknetConnector, tokenFromAddress, tokenToAddress);
    const {poolId, poolPair} = await MySwap.getInstance().getPoolDetails(tokenFrom, tokenTo);
    console.log(poolPair.token0Price.raw.toSignificant(6))
    console.log(poolPair.token1Price.raw.toSignificant(6))
    const swapParameters: SwapParameters = {
      tokenFrom: tokenFrom,
      tokenTo: tokenTo,
      amountIn: amountIn,
      amountOut: "0",
      poolPair: poolPair
    }

    const txSwap = await MySwap.getInstance().swap(starknetConnector, swapParameters, poolId);
    const hash = await account.execute(txSwap);
    console.log(`txSwap: ${JSON.stringify(hash)}`);
    setHash(hash.transaction_hash);
  }

  const mySwapLiq = async () => {
    //TODO use right values here for the swap
    //TODO calculate output of swap and use it as transaction value

    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }

    let amountTokenFrom = "100" //as specified by frontend - tokenFrom is the one on the top
    const tokenFromAddress = "0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10" //tst token
    const tokenToAddress = "0x044e592375a34fb4fdd3a5e2694cd2cbbcd61305b95cfac9d40c1f02ac64aa66";

    const {tokenFrom, tokenTo} = await createTokenObjects(starknetConnector, tokenFromAddress, tokenToAddress);
    const {poolId, poolPair} = await MySwap.getInstance().getPoolDetails(tokenFrom, tokenTo);
    console.log(poolPair.token0Price.raw.toSignificant(6))
    console.log(poolPair.token1Price.raw.toSignificant(6))
    amountTokenFrom = ethers.utils.parseUnits(amountTokenFrom, tokenFrom.decimals).toString()

    const tokenAmountFrom = new TokenAmount(tokenFrom, amountTokenFrom)

    const txLiq = await MySwap.getInstance().addLiquidity(starknetConnector, poolPair, SLIPPAGE, tokenAmountFrom)
    const hash = await account.execute(txLiq);
    console.log(`txSwap: ${JSON.stringify(hash)}`);
    setHash(hash.transaction_hash);
  }


  return (
    <Flex
      marginTop={"50px"}>
      <Button onClick={() => mySwap()}>mySwap</Button>
      <Button onClick={() => mySwapLiq()}>mySwapLiquidity</Button>

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
