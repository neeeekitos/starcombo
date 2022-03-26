import {useEffect, useState} from "react";
import {Abi, AccountInterface, AddTransactionResponse, Contract, Provider} from "starknet";
import BalancesAbi from "../contracts/artifacts/abis/balances.json";
import {Button, Flex} from "@chakra-ui/react";
import {COUNTER_ADDRESS} from "../pages/combos";
import {getStarknet} from "@argent/get-starknet/dist";


import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json"

import {ethers} from "ethers";
import {JEDI_ROUTER_ADDRESS, JEDI_TOKENS, JEDI_REGISTRY_ADDRESS} from "../constants/contants";
import {ChainId, Fetcher, Pair, Percent, Route, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {MySwap} from "../hooks/mySwap";


const getPoolInfo = async (poolNumber: string) => {
  const mySwapRouterContract = new Contract(mySwapRouter.abi as Abi, "0x071faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e");
  return await mySwapRouterContract.call("get_pool", [poolNumber]);
}

const getLiquidityPoolAddress = async (provider: Provider, tokenFrom: string, tokenTo: string) => {
  const liquidityPoolForTokens = await provider.callContract({
    contractAddress: JEDI_REGISTRY_ADDRESS,
    entrypoint: "get_pair_for",
    calldata: [
      ethers.BigNumber.from(tokenFrom).toBigInt().toString(),
      ethers.BigNumber.from(tokenTo).toBigInt().toString()
    ]
  }).then((res) => res.result[0])
  return liquidityPoolForTokens;
}

const Invocations = () => {

  const [acc, setAcc] = useState<AccountInterface>();
  const [hash, setHash] = useState<string>();
  const [provider, setProvider] = useState<Provider>()

  useEffect(() => {
    setup();
  }, [])

  const setup = async () => {
    const starknet = getStarknet();
    await starknet.enable();
    if (!starknet.isConnected) {
      alert("starknet is not connected");
      return;
    }
    console.log(starknet)
    setProvider(starknet.provider)
    const account = starknet.account;
    console.log(account);
    setAcc(account);
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
    const result = await acc!.execute(txs);
    console.log(result);
    setHash(result.transaction_hash);
  }

  const jediSwap = async () => {

    if (!provider || !acc) return;
    const amountFrom = "100000000000000000000";
    const amountTo = "3316"; //not necessary anymore for exact_tokens_for_tokens
    const tokenFrom = "0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c"; //jedifeb0
    const tokenTo = "0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756"; //jedifeb1
    const receiver = acc!.address;

    //We need these but idk why tbh
    const from = new Token(
      ChainId.GÖRLI,
      tokenFrom,
      18,
      't0'
    )
    const to = new Token(
      ChainId.GÖRLI,
      tokenTo,
      18,
      't1'
    )

    //Fetches liq pool address for tokenA and tokenB
    const liquidityPoolForTokens = await getLiquidityPoolAddress(provider, tokenFrom, tokenTo);


    //TODO throw error for frontend if couldn't find pool
    if (!liquidityPoolForTokens) return;
    console.log(liquidityPoolForTokens)

    //Returns token0 address
    const liqPoolToken0 = await provider.callContract({
      contractAddress: liquidityPoolForTokens!,
      entrypoint: "token0",
    }).then((res) => ethers.BigNumber.from(res.result[0]).toString())

    if (!liqPoolToken0) return;
    console.log(liqPoolToken0);

    // get reserves for the tokenA tokenB liq pool
    const liqReserves = await provider.callContract({
      contractAddress: liquidityPoolForTokens!,
      entrypoint: "get_reserves",
    }).then((res) => res.result);

    if (!liqReserves) return;
    console.log(liqReserves)
    //TODO throw error for frontend

    // TODO figure out why I had to do the inverse here
    let liqReserveTokenFrom = liqPoolToken0 === tokenFrom ? liqReserves[2] : liqReserves[0];
    let liqReserveTokenTo = liqPoolToken0 === tokenFrom ? liqReserves[0] : liqReserves[2];

    console.log(liqReserveTokenFrom)
    console.log(liqReserveTokenTo)

    //Create pair to find the best trade for this pair. Use liq reserves as pair amounts
    const pair_0_1 = new Pair(new TokenAmount(from, liqReserveTokenFrom), new TokenAmount(to, liqReserveTokenTo))

    console.log(pair_0_1)
    const trade = Trade.bestTradeExactIn([pair_0_1], new TokenAmount(from, amountFrom), to)[0];
    console.log(trade)
    console.log("execution price: $" + trade.executionPrice.toSignificant(6));
    console.log("price impact: " + trade.priceImpact.toSignificant(6) + "%");

    //TODO user-chosen value here
    const slippageTolerance = new Percent('50', '10000'); // 0.5%
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = ethers.BigNumber.from(amountOutMin.toString()).toBigInt()
    console.log(amountOutMinDec)

    const path = trade.route.path;
    const pathLength = path.length;
    const pathAddresses = path.map((token) => ethers.BigNumber.from(token.address.toString()).toBigInt()).toString();

    //flatten the calldata to make it into a single 1D array
    const swapCallData = [
      amountFrom,
      "0",
      amountOutMinDec.toString(),
      "0",
      pathLength.toString(),
      pathAddresses,
      ethers.BigNumber.from(receiver).toBigInt().toString(),
      Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
    ].flatMap((x) => x);

    console.log(swapCallData)


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
        calldata: swapCallData
      }
    ];
    const result = await acc!.execute(tx);
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
    console.log(testErc20Dec)
    const poolNumber = "4";
    // const poolInfo = await getPoolInfo(poolNumber); //4 is for test to tUSDC
    //TODO compute output amt here from pool values
    const minOutputAmt = "302379469743"
    const amountIn = (100 * 10 ** 18).toString();
    const tokenToDec = "1244282282488805475571988418073899266274761011798937057331700042103679053837";
    const tokenFromDec = "3267429884791031784129188059026496191501564961518175231747906707757621165072";
    const txSwap = await MySwap.getInstance().swap(tokenToDec, tokenFromDec, amountIn, "0");
    console.log(`txSwap: ${JSON.stringify(txSwap)}`);
    // try {
    //   const transac: AddTransactionResponse = await acc!.execute(
    //     [
    //       {
    //         contractAddress: testErc20Adress, //address for test token
    //         entrypoint: "approve",
    //         calldata: [
    //           "3222138877362455837336203414511899549532510795732583806035105711862644221454",
    //           tokenAmt,
    //           "0"
    //         ]
    //       },
    //       {
    //         contractAddress: "0x71faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e",
    //         entrypoint: "swap",
    //         calldata: [
    //           poolNumber,
    //           testErc20Dec,
    //           tokenAmt,
    //           "0",
    //           minOutputAmt,
    //           "0"
    //         ]
    //       }
    //     ],
    //   )
    //   console.log(transac);
    //   setHash(transac.transaction_hash);
    // } catch (e) {
    //   console.log(e);
    // }
  }


  return (
    <Flex
      marginTop={"50px"}>
      <Button onClick={() => makeTransaction()}>update balance</Button>
      <Button onClick={() => mySwap()}>mySwap</Button>
      <Button onClick={() => jediSwap()}>jediSwap</Button>

      {hash && <div>
        {hash}
      </div>}
    </Flex>
  )

}

export default Invocations;
