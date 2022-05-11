import {ChainId, Token} from '@jediswap/sdk'
import {validateAndParseAddress} from 'starknet'


//Jedi test tokens//
export const J23FEB0_ADDRESS = validateAndParseAddress('0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c');
export const J23FEB1_ADDRESS = validateAndParseAddress('0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756');
export const J23FEB2_ADDRESS = validateAndParseAddress('0x024da028e8176afd3219fbeafb17c49624af9b86dcbe81007ae40d93f741617d');
export const J23FEB3_ADDRESS = validateAndParseAddress('0x01ca5dedf1612b1ffb035e838ac09d70e500d22cf9cd0de4bebcef8553506fdb');

export const J23FEB0 = new Token(ChainId.GÖRLI, J23FEB0_ADDRESS, 18, 'J23FEB0', 'J23FEB0');
export const J23FEB1 = new Token(ChainId.GÖRLI, J23FEB1_ADDRESS, 6, 'J23FEB1', 'J23FEB1');
export const J23FEB2 = new Token(ChainId.GÖRLI, J23FEB2_ADDRESS, 18, 'J23FEB2', 'J23FEB2');
export const J23FEB3 = new Token(ChainId.GÖRLI, J23FEB3_ADDRESS, 18, 'J23FEB3', 'J23FEB3');

//Real test tokens//
export const WBTC_ADDRESS = validateAndParseAddress('0x12d537dc323c439dc65c976fad242d5610d27cfb5f31689a0a319b8be7f3d56');
export const DAI_ADDRESS = validateAndParseAddress('0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9');
export const USDC_ADDRESS = validateAndParseAddress('0x005a643907b9a4bc6a55e9069c4fd5fd1f5c79a22470690f75556c4736e34426');
export const ETH_ADDRESS = validateAndParseAddress('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');


export const WBTC = new Token(ChainId.GÖRLI, WBTC_ADDRESS, 8, 'WBTC', 'Wrapped BTC')
export const DAI = new Token(ChainId.GÖRLI, DAI_ADDRESS, 18, 'DAI', 'Dai')
export const USDC = new Token(ChainId.GÖRLI, USDC_ADDRESS, 6, 'USDC', 'USDC')
export const ETH = new Token(ChainId.GÖRLI, ETH_ADDRESS, 18, 'ETH', 'Ether');

// export const jediTokensList = {
//   [WBTC_ADDRESS]: WBTC,
//   [DAI_ADDRESS]: DAI,
//   [USDC_ADDRESS]: USDC,
//   [J23FEB0_ADDRESS]: J23FEB0,
//   [J23FEB1_ADDRESS]: J23FEB1,
//   [J23FEB2_ADDRESS]: J23FEB2,
//   [J23FEB3_ADDRESS]: J23FEB3,
// }


//Change registry address for bridged tokens
export const jediTokensList = [
  J23FEB0, J23FEB1, J23FEB2, J23FEB3,
  //TODO change registry and router addresses when these go live.
  // USDC, ETH, WBTC, DAI
]
