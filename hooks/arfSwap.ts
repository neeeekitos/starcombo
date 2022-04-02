import {DexCombo, StarknetConnector, SwapParameters} from "../utils/constants/interfaces";
import {Call, number, Provider} from "starknet";
import {ethers} from "ethers";
import {BigintIsh, Pair, Percent, Price, TokenAmount, Trade} from "@jediswap/sdk";
import {
  Action,
  ActionTypes,
  ARF_FACTORY_ADDRESS,
  ARF_ROUTER_ADDRESS,
  ProtocolNames
} from "../utils/constants/constants";
import {PoolPosition} from "./jediSwap";


interface findPoolRes {
  liqPoolAddress: string,
  liqPoolToken0: string,
  liqReservesToken0: BigintIsh,
  liqReservesToken1: BigintIsh
}

interface TradeInfo {
  pathLength: string,
  pathAddresses: Array<string>,
  executionPrice: string,
  amountOutMin: string
}

export class ArfSwap implements DexCombo {

  protected static instance: ArfSwap;

  protected constructor() {
  }

  public static getInstance(): ArfSwap {
    if (!ArfSwap.instance) {
      ArfSwap.instance = new ArfSwap();
    }

    return ArfSwap.instance;
  }

  /**
   * Adds liquidity to the liquidity pool associated to the pair.
   * @param starknetConnector
   * @param poolPair
   * @param slippage
   * @param tokenAmountFrom
   */
  async addLiquidity(starknetConnector: StarknetConnector, poolPair: Pair, slippage: Percent, tokenAmountFrom: TokenAmount): Promise<Action> {

    let tokenFrom, tokenTo, tokenFromIsToken0, tokenFromPrice: Price;
    tokenAmountFrom.token.address === poolPair.token0.address ?
      [tokenFrom, tokenTo, tokenFromIsToken0, tokenFromPrice] = [poolPair.token0, poolPair.token1, true, poolPair.token0Price] :
      [tokenFrom, tokenTo, tokenFromIsToken0, tokenFromPrice] = [poolPair.token1, poolPair.token0, false, poolPair.token1Price];

    const tokenFromDec = number.toBN(tokenFrom.address);
    const tokenToDec = number.toBN(tokenTo.address);

    let outputAmt, desiredAmountFrom, rawOutputAmt, minAmountFrom, desiredAmountTo, minAmountTo;

    // from
    desiredAmountFrom = ethers.BigNumber.from(tokenAmountFrom.raw.toString());
    minAmountFrom = desiredAmountFrom.sub(slippage.multiply(desiredAmountFrom.toBigInt()).toFixed(0)).toString()

    // to
    outputAmt = tokenFromPrice.raw.multiply(desiredAmountFrom.toString());
    rawOutputAmt = ethers.BigNumber.from(outputAmt[0].raw.toString());
    desiredAmountTo = rawOutputAmt;
    minAmountTo = desiredAmountTo.sub(slippage.multiply(desiredAmountTo.toBigInt()).toFixed(0)).toString();

    const callData: string[] = [
      tokenFromDec.toString(),
      tokenToDec.toString(),
      tokenFromIsToken0 ? desiredAmountFrom.toString() : desiredAmountTo.toString(),
      "0",
      tokenFromIsToken0 ? desiredAmountTo.toString() : desiredAmountFrom.toString(),
      "0",
      tokenFromIsToken0 ? minAmountFrom : minAmountTo,
      "0",
      tokenFromIsToken0 ? minAmountTo : minAmountFrom,
      "0"
    ];

    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(ARF_ROUTER_ADDRESS), // router address decimal
          desiredAmountFrom.toBigInt().toString(),
          "0"
        ]
      },
      {
        contractAddress: tokenTo.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(ARF_ROUTER_ADDRESS).toString(), // router address decimal
          desiredAmountTo.toBigInt().toString(),
          "0"
        ]
      },
      {
        contractAddress: ARF_ROUTER_ADDRESS,
        entrypoint: 'addLiquidity',
        calldata: callData
      }
    ];
    return Promise.resolve({
      actionType: ActionTypes.ADD_LIQUIDITY,
      protocolName: ProtocolNames.ARF,
      call: tx
    });
  }

  approve(): void {
  }

  mint(): void {
  }

  removeLiquidity(starknetConnector: StarknetConnector, poolPosition: PoolPosition, liqToRemove: TokenAmount): Promise<Action> {
    return Promise.resolve({
      actionType: ActionTypes.REMOVE_LIQUIDITY,
      protocolName: ProtocolNames.ARF,
      call: []
    });
  }

  revoke(): void {
  }

  /**
   * Returns the transaction details to perform a swap between two tokens
   * @param starknetConnector
   * @param swapParameters
   */
  public async swap(starknetConnector: StarknetConnector, swapParameters: SwapParameters): Promise<Action> {

    //DONT USE PARSE ETHER BECAUSE OUR TOKENS ARE NOT 18 DEC
    const amountIn = ethers.utils.parseUnits(swapParameters.amountIn, swapParameters.tokenFrom.decimals).toString();

    // Calculate the minimum amount of tokens out based on the slippage and the amount in
    const slippageTolerance = new Percent('50', '10000'); // 0.5%
    const trade = Trade.bestTradeExactIn([swapParameters.poolPair], new TokenAmount(swapParameters.tokenFrom, swapParameters.amountIn), swapParameters.tokenTo)[0];
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = number.toBN(amountOutMin.toString())

    const tokenFromDec = number.toBN(swapParameters.tokenFrom.address)
    const tokenToDec = number.toBN(swapParameters.tokenTo.address)

    const swapCallData: string[] = [
      tokenFromDec.toString(),
      tokenToDec.toString(),
      amountIn,
      amountOutMinDec.toString()
    ];

    const tx: Call | Call[] = [
      {
        contractAddress: swapParameters.tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(ARF_ROUTER_ADDRESS).toString(), // router address decimal
          amountIn,
          "0"
        ]
      },
      {
        contractAddress: ARF_ROUTER_ADDRESS,
        entrypoint: 'swapExactTokensForTokens',
        calldata: swapCallData
      }
    ];
    return Promise.resolve({
      actionType: ActionTypes.SWAP,
      protocolName: ProtocolNames.ARF,
      call: tx
    });
  }

  async findPool(provider: Provider, token0DecAdress: string, token1DecAddress: string): Promise<findPoolRes | undefined> {

    //Gets liq pool address for tokenFrom - tokenTo pool
    const liquidityPoolForTokens = await provider.callContract({
      contractAddress: ARF_FACTORY_ADDRESS,
      entrypoint: "getPool",
      calldata: [
        token0DecAdress,
        token1DecAddress
      ]
    }).then((res) => res.result[0])
    if (!liquidityPoolForTokens) return undefined

    //Gets address of pool's token0
    const liqPoolToken0 = await provider.callContract({
      contractAddress: liquidityPoolForTokens,
      entrypoint: "getToken0",
    }).then((res) => ethers.BigNumber.from(res.result[0]).toString())
    if (!liqPoolToken0) return undefined

    // Gets reserves for the tokenA tokenB liq pool
    const liqReserves = await provider.callContract({
      contractAddress: liquidityPoolForTokens!,
      entrypoint: "getReserves",
    }).then((res) => res.result);
    if (!liqPoolToken0) return undefined

    //Correctly map our token0 (tokenFrom) to the pool's token0
    let liqReservesToken0 = liqPoolToken0 === token0DecAdress ? liqReserves[0] : liqReserves[2];
    let liqReservesToken1 = liqPoolToken0 === token0DecAdress ? liqReserves[2] : liqReserves[0];

    return {
      liqPoolAddress: liquidityPoolForTokens,
      liqPoolToken0: liqPoolToken0,
      liqReservesToken0: liqReservesToken0,
      liqReservesToken1: liqReservesToken1
    }
  }

  /**
   * Given two tokens, finds the liquidity pool and returns the Pair associated.
   * @param provider
   * @param tokenFrom
   * @param tokenTo
   */
  async getPoolDetails(tokenFrom, tokenTo, provider: Provider) {
    const tokenFromDec = number.toBN(tokenFrom.address)
    const tokenToDec = number.toBN(tokenTo.address)

    // TODO handle pool finder (when tokens will be available)
    // const liquidityPool = await this.findPool(provider, tokenFromDec.toString(), tokenToDec.toString());
    // if (!liquidityPool) return undefined;

    const poolToken0 = new TokenAmount(tokenFrom, BigInt(1000000000000));
    const poolToken1 = new TokenAmount(tokenTo, BigInt(1000000000000));

    // const poolToken0 = new TokenAmount(tokenFrom, liquidityPool.liqReservesTokenFrom);
    // const poolToken1 = new TokenAmount(tokenTo, liquidityPool.liqReservesTokenTo);

    return {poolPair: new Pair(poolToken0, poolToken1, /* liquidityPool.liqPoolAddress */)};
  }
}
