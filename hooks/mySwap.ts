import {DexCombo, StarknetConnector, SwapParameters, TradeInfo} from "../utils/constants/interfaces";
import {ethers} from "ethers";

import {Abi, Call, Contract, number, Provider} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {ChainId, Fraction, Pair, Percent, Price, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {Action, ActionTypes, MY_SWAP_ROUTER_ADDRESS, ProtocolNames, SLIPPAGE} from "../utils/constants/constants";
import {PoolPosition} from "./jediSwap";

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
    //I'm cheating here and setting poolId inside the poolAddress field :)
    const poolPair = new Pair(poolTokenFrom, poolTokenTo, poolDetails.poolId);
    return {poolId: poolDetails.poolId, poolPair: poolPair};
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
    let trade = Trade.bestTradeExactIn([pairFromTo], new TokenAmount(from, amountFrom), to)[0];

    console.log("execution price: $" + trade.executionPrice.toSignificant(6));
    console.log("price impact: " + trade.priceImpact.toSignificant(6) + "%");

    //TODO dynamic slippage value here
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = number.toBN(amountOutMin.toString());

    return {
      executionPrice: trade.executionPrice.toSignificant(6),
      amountOutMin: amountOutMinDec.toString(),
    }

  }

  public async swap(starknetConnector: StarknetConnector, swapParameters: SwapParameters, poolId: string): Promise<Action> {
    let {tokenFrom, tokenTo, amountIn, amountOut, poolPair} = swapParameters;
    const tokenFromDec = number.toBN(tokenFrom.address).toString();
    //parse amount in with correct decimals
    amountIn = ethers.utils.parseUnits(amountIn, tokenFrom.decimals).toString()
    const trade = await this.findBestTrade(tokenFrom, tokenTo, poolPair, amountIn, "0", SLIPPAGE)
    if (!trade) return undefined;
    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(MY_SWAP_ROUTER_ADDRESS).toString(), // router address decimal
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

    return Promise.resolve({
      actionType: ActionTypes.SWAP,
      protocolName: ProtocolNames.MY_SWAP,
      call: tx
    });

  }

  async addLiquidity(starknetConnector: StarknetConnector, poolPair: Pair, slippage: Percent, tokenAmountFrom: TokenAmount): Promise<Action> {

    //TODO check if it's ok if amtToken0 corresponds to pool token 1
    //TODO check if there's another way to add fixed amountToken1 ? This works only if amountTokenFrom refers to Token0.

    let tokenFrom, tokenTo, tokenFromIsToken0, tokenFromPrice: Price;
    console.log(tokenAmountFrom.token.address, poolPair.token0.address)
    tokenAmountFrom.token.address === poolPair.token0.address ?
      [tokenFrom, tokenTo, tokenFromPrice, tokenFromIsToken0] = [poolPair.token0, poolPair.token1, poolPair.token0Price, true] :
      [tokenFrom, tokenTo, tokenFromPrice, tokenFromIsToken0] = [poolPair.token1, poolPair.token0, poolPair.token1Price, false];

    const tokenFromDec = number.toBN(tokenFrom.address);
    const tokenToDec = number.toBN(tokenTo.address);

    let desiredAmountFrom: ethers.BigNumber, minAmountFrom: string, desiredAmountTo: Fraction, minAmountTo: string;


    // from
    desiredAmountFrom = ethers.BigNumber.from(tokenAmountFrom.raw.toString());
    console.log(desiredAmountFrom)
    minAmountFrom = desiredAmountFrom.sub(SLIPPAGE.multiply(desiredAmountFrom.toBigInt()).toFixed(0)).toString()

    // to
    desiredAmountTo = tokenFromPrice.raw.multiply(desiredAmountFrom.toString());
    console.log(desiredAmountTo)
    minAmountTo = desiredAmountTo.subtract(SLIPPAGE.multiply(desiredAmountTo).toFixed(0)).toFixed(0)

    console.log(desiredAmountFrom.toString(), desiredAmountTo.toFixed(0), minAmountFrom, minAmountTo)
    console.log(tokenFromIsToken0)

    const callData: Array<string> = [
      tokenFromIsToken0 ? tokenFromDec.toString() : tokenToDec.toString(),
      tokenFromIsToken0 ? desiredAmountFrom.toString() : desiredAmountTo.toFixed(0),
      "0",
      tokenFromIsToken0 ? minAmountFrom : minAmountTo,
      "0",
      tokenFromIsToken0 ? tokenToDec.toString() : tokenFromDec.toString(),
      tokenFromIsToken0 ? desiredAmountTo.toFixed(0) : desiredAmountFrom.toString(),
      "0",
      tokenFromIsToken0 ? minAmountTo : minAmountFrom,
      "0"
    ];

    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(MY_SWAP_ROUTER_ADDRESS).toString(), // router address decimal
          desiredAmountFrom.toBigInt().toString(),
          "0"
        ]
      },
      {
        contractAddress: tokenTo.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(MY_SWAP_ROUTER_ADDRESS).toString(), // router address decimal
          desiredAmountTo.toFixed(0),
          "0"
        ]
      },
      {
        contractAddress: MY_SWAP_ROUTER_ADDRESS,
        entrypoint: 'add_liquidity',
        calldata: callData
      }
    ];
    return Promise.resolve({
      actionType: ActionTypes.ADD_LIQUIDITY,
      protocolName: ProtocolNames.MY_SWAP,
      call: tx
    });
  }

  approve(): void {
  }

  mint(): void {
  }

  removeLiquidity(starknetConnector: StarknetConnector, poolPosition: PoolPosition, liqToRemove: TokenAmount): Promise<Action> {

    const poolPair = poolPosition.poolPair;
    let poolShare = poolPosition.userLiquidity.divide(poolPosition.poolSupply); // represents the %of the pool the user owns.
    //token0Amount is reserve0*poolShare
    let token0Amount = poolPair.reserve0.multiply(poolShare);
    let token1Amount = poolPair.reserve1.multiply(poolShare)
    //These values are not in WEI but in unit... so we need to find a way to give the wei value without rounding.
    //To do so we parse units the whole result with the token decimals.
    // Inside this, we're calculating tokenAmount(1-slippage). Note that this result is in unit and not wei terms so we need to parseUnit all of this :)
    let token0min = ethers.utils.parseUnits(token0Amount.subtract(token0Amount.multiply(SLIPPAGE)).toFixed(poolPair.token0.decimals), poolPair.token0.decimals);
    let token1min = ethers.utils.parseUnits(token1Amount.subtract(token1Amount.multiply(SLIPPAGE)).toFixed(poolPair.token1.decimals), poolPair.token1.decimals);
    const tx: Call | Call[] = {
      contractAddress: MY_SWAP_ROUTER_ADDRESS,
      entrypoint: "withdraw_liquidity",
      calldata: [
        poolPosition.poolPair.pairAddress, //no need for BN ops here because it's just the poolId
        liqToRemove.raw.toString(),
        "0",
        token0min.toString(),
        "0",
        token1min.toString(),
        "0"
      ]
    }
    return Promise.resolve({
      actionType: ActionTypes.REMOVE_LIQUIDITY,
      protocolName: ProtocolNames.MY_SWAP,
      call: tx
    });
  }

  revoke(): void {
  }

  async getLiquidityPosition(starknetConnector: StarknetConnector, tokenFrom: Token, tokenTo: Token): Promise<PoolPosition> {
    const {account, provider} = starknetConnector;

    const poolDetails = await this.getPoolDetails(tokenFrom, tokenTo);
    const poolId = poolDetails.poolPair.pairAddress;

    const userBalance = await provider.callContract({
      contractAddress: MY_SWAP_ROUTER_ADDRESS,
      entrypoint: "get_lp_balance",
      calldata: [
        poolId,
        number.toBN(starknetConnector.account.address).toString()
      ]
    }).then((res) => res.result[0]);

    const totalSupply = await provider.callContract({
      contractAddress: MY_SWAP_ROUTER_ADDRESS,
      entrypoint: "get_total_shares",
      calldata: [poolId]
    }).then((res) => res.result[0]);

    const supply = new TokenAmount(new Token(ChainId.GÖRLI, "0", 18), totalSupply);
    const userLiquidity = new TokenAmount(new Token(ChainId.GÖRLI, "0", 18), userBalance);

    return {
      poolSupply: supply,
      userLiquidity: userLiquidity,
      poolPair: poolDetails.poolPair,
    }

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
          poolName: pool[0].name,
          liqReservesTokenFrom: liqReservesTokenFrom,
          liqReservesTokenTo: liqReservesTokenTo,
          feePercentage: pool[0].fee_percentage.toString()
        });

      }
    }
    return Promise.reject("Pool not found");
  }
}
