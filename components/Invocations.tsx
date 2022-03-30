import {useEffect, useState} from "react";
import {Abi, AccountInterface, AddTransactionResponse, Contract, Provider} from "starknet";
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
import {ArfSwap} from "../hooks/arfSwap";
import {getPair} from "../hooks/dexTools";


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

  const arfSwap = async () => {

    const amountFrom = "100.10";
    const amountTo = "0";
    const tokenFromAddress = "0x3dd7b0db7cca8e8468d06d27b40ca9368754c30d76900fcd19a65736fab9084";
    const tokenToAddress = "0x4b60f66889f5d3d96022bfb9d761b73baeefe7f46070a1d33ed71ea4e837b75";

    const tokenFromDecimals = await getErc20Decimals(provider, tokenFromAddress);
    const tokenToDecimals = await getErc20Decimals(provider, tokenToAddress);

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

    const arfSwap: ArfSwap = ArfSwap.getInstance();
    const arfPair = await getPair(provider, {
      token0: tokenFrom,
      token1 : tokenTo,
    }, arfSwap.findPool);

    console.log(`pair: ${pair.token0.address} ${pair.token1.address}`);

    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }

    const swapParameters: SwapParameters = {
      tokenFrom: tokenFrom,
      tokenTo: tokenTo,
      amountIn: amountFrom,
      amountOut: amountTo,
      poolPair: arfPair
    }

    const txSwap = await arfSwap.swap(starknetConnector, swapParameters);
    console.log(`txSwap: ${JSON.stringify(txSwap)}`);
    const txResult = await account.execute(txSwap)
    setHash(txResult.transaction_hash);
  }

  const arfAddLiquidity = async () => {
    let amountTokenFrom = "100"; //TODO user defined
    const amountTokenTo = "0"; //not necessary anymore for exact_tokens_for_tokens
    const token0Address = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c";
    const token1Address = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756";

    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    }
    const tokenFrom = new Token(
      ChainId.GÖRLI,
      token0Address,
      parseInt("18"),
    )
    const tokenTo = new Token(
      ChainId.GÖRLI,
      token1Address,
      parseInt("18"),
    )

    const arfSwap: ArfSwap = ArfSwap.getInstance();
    const poolPair = await arfSwap.getPair(provider, tokenFrom, tokenTo)
    amountTokenFrom = ethers.utils.parseUnits(amountTokenFrom, tokenFrom.decimals).toString()
    const tokenAmountFrom = new TokenAmount(tokenFrom, amountTokenFrom)
    const addLiquidityTx = await arfSwap.addLiquidity(starknetConnector, poolPair, new Percent('50', '10000'), tokenAmountFrom); // 0.5%, tokenAmountFrom)
    console.log(`[ARF Add Liquidity result] : ${hash}`);
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
    console.log(poolPair.token0Price.raw.toSignificant(6))
    console.log(poolPair.token1Price.raw.toSignificant(6))
    amountTokenFrom = ethers.utils.parseUnits(amountTokenFrom, tokenFrom.decimals).toString()
    const tokenAmountFrom = new TokenAmount(tokenFrom, amountTokenFrom)
    const addLiquidityTx = await jediSwap.addLiquidity(starknetConnector, poolPair, SLIPPAGE, tokenAmountFrom)
    const hash = await account.execute(addLiquidityTx);
    console.log(`[jediSwap liq result] : ${hash}`);
  }

  const jediSwapRemoveLiq = async () => {
    const liqPoolAddress = "0x04b05cce270364e2e4bf65bde3e9429b50c97ea3443b133442f838045f41e733"; //jedifeb0/1
    const token0Address = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c"; //jedifeb0
    const token1Address = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756"; //jedifeb1
    const starknetConnector: StarknetConnector = {
      account: account,
      provider: provider
    };

    const {
      tokenFrom: token0,
      tokenTo: token1
    } = await createTokenObjects(starknetConnector, token0Address, token1Address);
    const liqPoolTokenDec = await getErc20Decimals(provider, liqPoolAddress);
    const liqPoolToken = new Token(ChainId.GÖRLI, liqPoolAddress, parseInt(liqPoolTokenDec));

    const poolPosition = await JediSwap.getInstance().getLiquidityPosition(starknetConnector, liqPoolToken, token0, token1);
    console.log(poolPosition)
    const tx = JediSwap.getInstance().removeLiquidity(starknetConnector, poolPosition, poolPosition.userLiquidity);
    const txResult = await account.execute(tx)
    setHash(txResult.transaction_hash);
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

  const mySwapRemoveLiq = async () => {
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
    const poolPosition = await MySwap.getInstance().getLiquidityPosition(starknetConnector, tokenFrom, tokenTo);
    const tx = MySwap.getInstance().removeLiquidity(starknetConnector, poolPosition, poolPosition.userLiquidity);
    const txResult = await account.execute(tx)
    setHash(txResult.transaction_hash);
  }


  return (
    <Flex
      marginTop={"50px"}>
      <Button onClick={() => mySwap()}>mySwap</Button>
      <Button onClick={() => mySwapLiq()}>mySwapLiquidity</Button>
      <Button onClick={() => mySwapRemoveLiq()}>myswap remove liq</Button>

      <Button onClick={() => jediSwap()}>jediSwap</Button>
      {pair && <div>
        {`${pair.token0Price.raw.toSignificant(6)} token0 = ${pair.token1Price.raw.toSignificant(6)}`}
      </div>}
      <Button onClick={() => jediSwapLiq()}>jediswapLiquidity</Button>
      <Button onClick={() => arfSwap()}>arfSwap</Button>
      <Button onClick={() => jediSwapRemoveLiq()}>jedisawp remove liq</Button>
      <Button onClick={() => arfAddLiquidity()}>arfLiquidity</Button>


      {hash && <div>
        {hash}
      </div>}
    </Flex>
  )

}

export default Invocations;
