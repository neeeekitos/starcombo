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
