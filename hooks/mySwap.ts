import {DexCombo, StarknetConnector, SwapParameters, TradeInfo} from "../utils/constants/interfaces";
import {ethers} from "ethers";

import {Abi, AccountInterface, Call, Contract, number, Provider} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {Pair, Percent, Token, TokenAmount, Trade} from "@jediswap/sdk";
import BN from "bn.js";
import {fromEntries} from "@chakra-ui/utils";
import {JEDI_ROUTER_ADDRESS, MY_SWAP_ROUTER_ADDRESS, SLIPPAGE} from "../utils/constants/constants";

export class MySwap implements DexCombo {

  protected static instance: MySwap;

  protected constructor() {
  }

  public static getInstance(): MySwap {
    if (!MySwap.instance) {
      MySwap.instance = new MySwap();
    }

    return MySwap.instance;
  }

  /**
   * Given two tokens, finds the liquidity pool and return the associated pair as well as the poolId.
   * The pool.liauiquidityToken is incorrect.
   * @param tokenFrom
   * @param tokenTo
   */
  async getPoolDetails(tokenFrom: Token, tokenTo: Token) {
    //format input according to decimals

    const tokenFromAddress = number.toBN(tokenFrom.address)
    const tokenToAddress = number.toBN(tokenTo.address)

    const poolDetails = await this.findPool(tokenFromAddress.toString(), tokenToAddress.toString());
    if (!poolDetails) return undefined;

    const poolTokenFrom = new TokenAmount(tokenFrom, poolDetails.liqReservesTokenFrom);
    const poolTokenTo = new TokenAmount(tokenTo, poolDetails.liqReservesTokenTo);
    const pair_0_1 = new Pair(poolTokenFrom, poolTokenTo);
    return {poolId: poolDetails.poolId, poolPair: pair_0_1};
  }

  /**
   * Given a from and two token and the pair associated to the liquidity pool, returns the execution price of the trade
   * and the minimum amount out.
   * @param from
   * @param to
   * @param pairFromTo
   * @param amountFrom
   * @param amountTo
   * @param slippageTolerance
   */
  async findBestTrade(from: Token, to: Token, pairFromTo: Pair, amountFrom: string, amountTo: string, slippageTolerance: Percent): Promise<TradeInfo | undefined> {
    //Create poolPair to find the best trade for this poolPair. Use liq reserves as poolPair amounts
    console.log(pairFromTo, from, amountFrom, to)
    let trade = Trade.bestTradeExactIn([pairFromTo], new TokenAmount(from, amountFrom), to)[0];

    console.log(trade)
    console.log("execution price: $" + trade.executionPrice.toSignificant(6));
    console.log("price impact: " + trade.priceImpact.toSignificant(6) + "%");

    //TODO dynamic slippage value here
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = ethers.BigNumber.from(amountOutMin.toString()).toBigInt()

    return {
      executionPrice: trade.executionPrice.toSignificant(6),
      amountOutMin: amountOutMinDec.toString(),
    }

  }

  public async swap(starknetConnector: StarknetConnector, swapParameters:SwapParameters, poolId: string): Promise<any> {
    let {tokenFrom, tokenTo, amountIn, amountOut, poolPair} = swapParameters;
    const tokenFromDec = ethers.BigNumber.from(tokenFrom.address).toBigInt().toString();
    //parse amount in with correct decimals
    amountIn = ethers.utils.parseUnits(amountIn, tokenFrom.decimals).toString()
    const trade = await this.findBestTrade(tokenFrom, tokenTo, poolPair, amountIn, "0", SLIPPAGE)
    if (!trade) return undefined;
    const tx = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(MY_SWAP_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          amountIn,
          "0"
        ]
      },
      {
        contractAddress: MY_SWAP_ROUTER_ADDRESS,
        entrypoint: "swap",
        calldata: [
          poolId,
          tokenFromDec,
          amountIn,
          "0",
          trade.amountOutMin,
          "0"
        ]
      }
    ]
    return tx;

  }

  async addLiquidity(starknetConnector: StarknetConnector, poolPair: Pair, slippage: Percent, tokenAmountFrom: TokenAmount): Promise<Call | Call[]> {

    //TODO check if it's ok if amtToken0 corresponds to pool token 1
    //TODO check if there's another way to add fixed amountToken1 ? This works only if amountTokenFrom refers to Token0.

    //Add liquidity to pool with poolPair 0 and poolPair 1.
    //We provide tokenAmountFrom:TokenAmount.
    //so if token0 == tokenFrom we're gucci otherwise we must invert the values.
    const tokenFromIsToken0 = tokenAmountFrom.token.address === poolPair.token0.address;
    const tokenFromDec = ethers.BigNumber.from(poolPair.token0.address).toBigInt().toString()
    const tokenToDec = ethers.BigNumber.from(poolPair.token1.address).toBigInt().toString()
    const token0Dec = tokenFromIsToken0 ? tokenFromDec:tokenToDec;
    const token1Dec = tokenFromIsToken0 ? tokenToDec:tokenFromDec

      //get output amt for token input
    let outputAmt, desiredAmount0, rawOutputAmt, minAmount0, desiredAmount1, minAmount1;
    if (tokenFromIsToken0) {
      desiredAmount0 = ethers.BigNumber.from(tokenAmountFrom.raw.toString());
      minAmount0 = desiredAmount0.sub(slippage.multiply(desiredAmount0.toBigInt()).toFixed(0)).toString()
      outputAmt = poolPair.getOutputAmount(new TokenAmount(poolPair.token0, tokenAmountFrom.raw.toString()));
      desiredAmount1 = ethers.BigNumber.from(outputAmt[0].raw.toString());
      minAmount1 = desiredAmount1.sub(slippage.multiply(desiredAmount1.toBigInt()).toFixed(0)).toString()

    } else {
      desiredAmount1 = ethers.BigNumber.from(tokenAmountFrom.raw.toString());
      minAmount1 = desiredAmount1.sub(slippage.multiply(desiredAmount1.toBigInt()).toFixed(0)).toString()
      outputAmt = poolPair.getOutputAmount(new TokenAmount(poolPair.token1, tokenAmountFrom.raw.toString()));
      desiredAmount0 = ethers.BigNumber.from(outputAmt[0].raw.toString());
      minAmount0 = desiredAmount0.sub(slippage.multiply(desiredAmount0.toBigInt()).toFixed(0)).toString()
    }



    const tx = [
      {
        contractAddress: poolPair.token0.address,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(MY_SWAP_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          desiredAmount0.toString(),
          "0"
        ]
      },
      {
        contractAddress: poolPair.token1.address,
        entrypoint: 'approve',
        calldata: [
          ethers.BigNumber.from(MY_SWAP_ROUTER_ADDRESS).toBigInt().toString(), // router address decimal
          desiredAmount1.toString(),
          "0"
        ]
      },
      {
        contractAddress: MY_SWAP_ROUTER_ADDRESS,
        entrypoint: 'add_liquidity',
        calldata: [
          token0Dec,
          desiredAmount0.toString(),
          "0", //this is bcause desiredAmount is a uint256 with 2 members: low and high. we set high to 0.
          minAmount0,
          "0",
          token1Dec,
          desiredAmount1.toString(),
          "0",
          minAmount1,
          "0"
        ]
      }
    ];
    return tx;
  }

  approve(): void {
  }

  mint(): void {
  }

  removeLiquidity(): void {
  }

  revoke(): void {
  }

  /**
   * Returns all of a pool's detail
   * @param tokenFromDecAddress
   * @param tokenToDecAddress
   */
  async findPool(tokenFromDecAddress: string, tokenToDecAddress: string): Promise<any> {
    const mySwapRouterContract = new Contract(mySwapRouter.abi as Abi, MY_SWAP_ROUTER_ADDRESS);
    const numberOfPools = await mySwapRouterContract.call("get_total_number_of_pools");
    console.log(`Number of pools: ${numberOfPools}`);
    for (let i = 1; i <= Number(numberOfPools[0]); i++) {
      const pool = await mySwapRouterContract.call("get_pool", [i]);
      if (pool[0].token_a_address.toString() === tokenFromDecAddress && pool[0].token_b_address.toString() === tokenToDecAddress ||
        pool[0].token_a_address.toString() === tokenToDecAddress && pool[0].token_b_address.toString() === tokenFromDecAddress) {

        let liqReservesTokenFrom;
        let liqReservesTokenTo;
        if (pool[0].token_a_address.toString() === tokenFromDecAddress) {
          liqReservesTokenFrom = pool[0].token_a_reserves.low.toString();
          liqReservesTokenTo = pool[0].token_b_reserves.low.toString();
        } else {
          liqReservesTokenFrom = pool[0].token_b_reserves.low.toString();
          liqReservesTokenTo = pool[0].token_a_reserves.low.toString();
        }
        return Promise.resolve({
          poolId: i.toString(),
          liqReservesTokenFrom: liqReservesTokenFrom,
          liqReservesTokenTo: liqReservesTokenTo
        });

      }
    }
    return Promise.reject("Pool not found");
  }
}
