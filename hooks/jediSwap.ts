import {
  DexCombo,
  findPoolRes,
  LiquidityPoolInfo,
  LiquidityPoolInputs,
  StarknetConnector, SwapParameters, TradeInfo
} from "../utils/constants/interfaces";
import {Abi, AccountInterface, Call, Contract, Provider, stark} from "starknet";
import mySwapRouter from "../contracts/artifacts/abis/myswap/router.json";
import {
  Action, ActionTypes,
  JEDI_REGISTRY_ADDRESS,
  JEDI_ROUTER_ADDRESS,
  MY_SWAP_ROUTER_ADDRESS, ProtocolNames,
  SLIPPAGE
} from "../utils/constants/constants";
import {BigNumber, ethers} from "ethers";
import {useStarknet} from "./useStarknet";
import {BigintIsh, ChainId, Fraction, JSBI, Pair, Percent, Price, Token, TokenAmount, Trade} from "@jediswap/sdk";
import {loadGetInitialProps} from "next/dist/shared/lib/utils";
import {number} from "starknet";
import {createTokenObjects} from "../utils/helpers";

export interface PoolPosition {
  poolSupply: TokenAmount,
  userLiquidity: TokenAmount,
  poolPair: Pair,
}

export class JediSwap implements DexCombo {

  protected static instance: JediSwap;

  protected constructor() {
  }

  public static getInstance(): JediSwap {
    if (!JediSwap.instance) {
      JediSwap.instance = new JediSwap();
    }

    return JediSwap.instance;
  }

  /**
   * Given two tokens, finds the liquidity pool and returns the Pair associated.
   * @param provider
   * @param tokenFrom
   * @param tokenTo
   */
  async getPair(provider: Provider, tokenFrom: Token, tokenTo: Token) {

    const tokenFromDec = number.toBN(tokenFrom.address)
    const tokenToDec = number.toBN(tokenTo.address)

    const liquidityPool = await this.findPool(provider, tokenFromDec.toString(), tokenToDec.toString());
    if (!liquidityPool) return undefined;

    const poolToken0 = new TokenAmount(tokenFrom, liquidityPool.liqReservesTokenFrom);
    const poolToken1 = new TokenAmount(tokenTo, liquidityPool.liqReservesTokenTo);
    const poolPair = new Pair(poolToken0, poolToken1, liquidityPool.liqPoolAddress);

    return poolPair;
  }

  async getLiquidityPosition(starknetConnector: StarknetConnector, liqPoolToken: Token, token0: Token, token1: Token) {
    const {account, provider} = starknetConnector;
    const userBalance = await provider.callContract({
      contractAddress: liqPoolToken.address,
      entrypoint: "balanceOf",
      calldata: [number.toBN(account.address).toString()]
    }).then((res) => res.result[0]);

    const totalSupply = await provider.callContract({
      contractAddress: liqPoolToken.address,
      entrypoint: "totalSupply",
    }).then((res) => res.result[0]);


    const supply = new TokenAmount(liqPoolToken, totalSupply);
    const liquidity = new TokenAmount(liqPoolToken, userBalance);
    const poolPair = await this.getPair(provider, token0, token1);

    return {
      poolSupply: supply,
      userLiquidity: liquidity,
      poolPair: poolPair,
    }

  }

  /**
   * Adds liquidity to the liquidity pool associated to the pair.
   * @param starknetConnector
   * @param poolPair
   * @param slippage
   * @param tokenAmountFrom
   */
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
        tokenFromIsToken0 ? tokenToDec.toString() : tokenFromDec.toString(),
        tokenFromIsToken0 ? desiredAmountFrom.toString() : desiredAmountTo.toFixed(0),
        "0",
        tokenFromIsToken0 ? desiredAmountTo.toFixed(0) : desiredAmountFrom.toString(),
        "0",
        tokenFromIsToken0 ? minAmountFrom : minAmountTo,
        "0",
        tokenFromIsToken0 ? minAmountTo : minAmountFrom,
        "0",
        number.toBN(starknetConnector.account.address).toString(),
        Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
      ];

    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(JEDI_ROUTER_ADDRESS).toString(), // router address decimal
          desiredAmountFrom.toBigInt().toString(),
          "0"
        ]
      },
      {
        contractAddress: tokenTo.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(JEDI_ROUTER_ADDRESS).toString(), // router address decimal
          desiredAmountTo.toFixed(0),
          "0"
        ]
      },
      {
        contractAddress: JEDI_ROUTER_ADDRESS,
        entrypoint: 'add_liquidity',
        calldata: callData
      }
    ];
    return Promise.resolve({
      actionType: ActionTypes.ADD_LIQUIDITY,
      protocolName: ProtocolNames.JEDISWAP,
      call: tx
    });
  }

  approve(): void {
  }

  mint(): void {
  }

  removeLiquidity(starknetConnector: StarknetConnector, poolPosition: PoolPosition, liqToRemove: TokenAmount): Promise<Action> {

    const poolPair: Pair = poolPosition.poolPair;
    let token0Amount = poolPair.getLiquidityValue(poolPair.token0, poolPosition.poolSupply, liqToRemove);
    let token1Amount = poolPair.getLiquidityValue(poolPair.token1, poolPosition.poolSupply, liqToRemove);
    console.log(token0Amount.raw.toString())
    console.log(token1Amount.raw.toString())

    const approval: Call | Call[] = {
      contractAddress: poolPair.pairAddress,
      entrypoint: 'approve',
      calldata: [
        number.toBN(JEDI_ROUTER_ADDRESS).toString(), // router address decimal
        liqToRemove.raw.toString(),
        "0"
      ]
    }

    const remove_liq: Call | Call[] = {
      contractAddress: JEDI_ROUTER_ADDRESS,
      entrypoint: 'remove_liquidity',
      calldata: [
        number.toBN(poolPair.token0.address).toString(),
        number.toBN(poolPair.token1.address).toString(),
        liqToRemove.raw.toString(),
        "0",
        token0Amount.raw.toString(),
        "0",
        token1Amount.raw.toString(),
        "0",
        number.toBN(starknetConnector.account.address).toString(),
        Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
      ]
    }

    return Promise.resolve({
      actionType: ActionTypes.REMOVE_LIQUIDITY,
      protocolName: ProtocolNames.JEDISWAP,
      call: [approval, remove_liq]
    });
  }

  revoke(): void {
  }

  /**
   * Returns the transaction details to perform a swap between two tokens
   * @param starknetConnector
   * @param swapParameters
   * @param poolId
   */
  public async swap(starknetConnector: StarknetConnector, swapParameters: SwapParameters): Promise<Action> {
    let {tokenFrom, tokenTo, amountIn, amountOut, poolPair} = swapParameters;
    //TODO handle when user specifies amountOut
    //DONT USE PARSE ETHER BECAUSE OUR TOKENS ARE NOT 18 DEC
    amountIn = ethers.utils.parseUnits(amountIn, tokenFrom.decimals).toString();
    amountOut = ethers.utils.parseUnits(amountOut, tokenTo.decimals).toString();

    const trade = await this.findBestTrade(tokenFrom, tokenTo, poolPair, amountIn, amountOut, SLIPPAGE)
    if (!trade) return undefined;

    //flatten the array because trade.pathAddresses is a subarray
    const swapCallData = [
      amountIn,
      "0",
      trade.amountOutMin,
      "0",
      trade.pathLength,
      trade.pathAddresses,
      number.toBN(starknetConnector.account.address).toString(),
      Math.floor((Date.now() / 1000) + 3600).toString() // default timeout is 1 hour
    ].flatMap((x) => x);

    const tx: Call | Call[] = [
      {
        contractAddress: tokenFrom.address,
        entrypoint: 'approve',
        calldata: [
          number.toBN(JEDI_ROUTER_ADDRESS).toString(), // router address decimal
          amountIn,
          "0"
        ]
      },
      {
        contractAddress: JEDI_ROUTER_ADDRESS,
        entrypoint: 'swap_exact_tokens_for_tokens',
        calldata: swapCallData
      }
    ];
    return Promise.resolve({
      actionType: ActionTypes.SWAP,
      protocolName: ProtocolNames.JEDISWAP,
      call: tx
    });
  }

  async getPoolDetails(liqPoolAddress: string) {

  }

  /**
   * Given two decimal tokens addresses, finds the associated pool and returns details about the liquidity pool (address, token0, reserves).
   * @param provider
   * @param tokenFromDecAddress
   * @param tokenToDecAddress
   */
  async findPool(provider: Provider, tokenFromDecAddress: string, tokenToDecAddress: string): Promise<findPoolRes | undefined> {

    //Gets liq pool address for tokenFrom - tokenTo pool
    const liquidityPoolForTokens = await provider.callContract({
      contractAddress: JEDI_REGISTRY_ADDRESS,
      entrypoint: "get_pair_for",
      calldata: [
        tokenFromDecAddress,
        tokenToDecAddress
      ]
    }).then((res) => res.result[0])
    if (!liquidityPoolForTokens) return undefined

    //Gets address of pool's token0
    const liqPoolToken0 = await provider.callContract({
      contractAddress: liquidityPoolForTokens,
      entrypoint: "token0",
    }).then((res) => number.toBN(res.result[0]).toString())
    if (!liqPoolToken0) return undefined

    // Gets reserves for the tokenA tokenB liq pool
    const liqReserves = await provider.callContract({
      contractAddress: liquidityPoolForTokens!,
      entrypoint: "get_reserves",
    }).then((res) => res.result);
    if (!liqPoolToken0) return undefined

    //Correctly map our token0 (tokenFrom) to the pool's token0
    let liqReservesTokenFrom = liqPoolToken0 === tokenFromDecAddress ? liqReserves[0] : liqReserves[2];
    let liqReservesTokenTo = liqPoolToken0 === tokenFromDecAddress ? liqReserves[2] : liqReserves[0];

    return {
      liqPoolAddress: liquidityPoolForTokens,
      liqPoolToken0: liqPoolToken0,
      liqReservesTokenFrom: liqReservesTokenFrom,
      liqReservesTokenTo: liqReservesTokenTo
    }
  }

  async findBestTrade(from: Token, to: Token, pairFromTo: Pair, amountFrom: string, amountTo: string, slippageTolerance: Percent): Promise<TradeInfo | undefined> {
    //Create poolPair to find the best trade for this poolPair. Use liq reserves as poolPair amounts
    let trade: Trade;
    console.log(pairFromTo, from, amountFrom, to)
    if (amountTo === "0") {
      trade = Trade.bestTradeExactIn([pairFromTo], new TokenAmount(from, amountFrom), to)[0];

    } else {
      trade = Trade.bestTradeExactOut([pairFromTo], from, new TokenAmount(from, amountFrom))[0];
    }

    console.log(trade)
    console.log("execution price: $" + trade.executionPrice.toSignificant(6));
    console.log("price impact: " + trade.priceImpact.toSignificant(6) + "%");

    //TODO dynamic slippage value here
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinDec = ethers.BigNumber.from(amountOutMin.toString()).toBigInt()

    const path = trade.route.path;
    const pathAddresses = path.map((token: Token) => ethers.BigNumber.from(token.address.toString()).toBigInt().toString());
    return {
      pathLength: path.length.toString(),
      pathAddresses: pathAddresses,
      executionPrice: trade.executionPrice.toSignificant(6),
      amountOutMin: amountOutMinDec.toString(),
    }
  }
}
