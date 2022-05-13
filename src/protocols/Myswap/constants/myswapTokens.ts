import {ChainId, Token} from '@jediswap/sdk'
import {validateAndParseAddress} from 'starknet'

export const TST_ADDRESS = validateAndParseAddress("0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10");
export const TWETH_ADDRESS = validateAndParseAddress("0x02c03d22f43898f146e026a72f4cf37b9e898b70a11c4731665e0d75ce87700d");
export const TUSDC_ADDRESS = validateAndParseAddress("0x044e592375a34fb4fdd3a5e2694cd2cbbcd61305b95cfac9d40c1f02ac64aa66");
export const TCOMP_ADDRESS = validateAndParseAddress("0x07f6e6a3b90ebe02190fba0269becaf8828b9219e92a7a041fa6da3ef11d0c6a");

export const TST = new Token(ChainId.GÖRLI, TST_ADDRESS, 18, 'TST', 'Test Token');

export const TWETH = new Token(ChainId.GÖRLI, TWETH_ADDRESS, 18, 'tWETH', 'Test WETH');

export const TUSDC = new Token(ChainId.GÖRLI, TUSDC_ADDRESS, 18, 'tUSDC', 'Test USD');

export const TCOMP = new Token(ChainId.GÖRLI, TCOMP_ADDRESS,18,'tCOMP', 'Test Compound')

// export const myswapTokenList= {
//   [TST_ADDRESS]: TST,
//   [TWETH_ADDRESS]: TWETH,
//   [TUSDC_ADDRESS]: TUSDC,
//   [TCOMP_ADDRESS] : TCOMP
// }

export const myswapTokenList = [
  TST,TWETH,TUSDC,TCOMP
]
