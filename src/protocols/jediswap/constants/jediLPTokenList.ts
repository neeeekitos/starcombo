import {
  DAI, J23FEB0,
  J23FEB0_ADDRESS, J23FEB1,
  J23FEB1_ADDRESS, J23FEB2,
  J23FEB2_ADDRESS, J23FEB3,
  J23FEB3_ADDRESS,
  jediTokensList,
  USDC,
  WBTC
} from './jediTokens'
import {ChainId, LPToken} from '@jediswap/sdk'

export const jediPairAddresses = {
  ETH_WBTC: '0x699b290b25c03cedf6a29e767b40420b572bee5296dd284b34304dfdf52f847',
  ETH_DAI: '0x78cf9537391591ebb9700d11f0980e05a6cf5fffc50fd31e433377f59ad840f',
  ETH_USDC: '0x30da33d4e75cd9dd614c76a50706a0a853c86b7ad145c2efb8855a04394a853',
  WBTC_USDC: '0x14e0c32a4d419cbe90ff51ab5418fd75e1f0c62d5b4c77473a4de594e88922c',
  DAI_USDC: '0x195d8a828e538d9a2f53126b8c162ed707d0fe8dab8888497fefef4615f9ffe',
  J23FEB0_J23FEB1:'0x04b05cce270364e2e4bf65bde3e9429b50c97ea3443b133442f838045f41e733',
  J23FEB0_J23FEB2:'0x0682bde101e0fa17bb61d867a14db62ddd192d35cc4ad2109e91429e2e4fca17',
  J23FEB0_J23FEB3:'0x13386f165f065115c1da38d755be261023c32f0134a03a8e66b6bb1e0016014'

}

// export const LP_ETH_WBTC = new LPToken(ChainId.GÖRLI, WBTC, DAI, jediPairAddresses.ETH_WBTC)

// export const LP_ETH_DAI = new LPToken(ChainId.GÖRLI, WBTC, DAI, jediPairAddresses.ETH_DAI)
//
// export const LP_ETH_USDC = new LPToken(ChainId.GÖRLI, WBTC, USDC, jediPairAddresses.ETH_USDC)

export const LP_WBTC_USDC = new LPToken(ChainId.GÖRLI, WBTC, USDC, jediPairAddresses.WBTC_USDC)

export const LP_DAI_USDC = new LPToken(ChainId.GÖRLI, DAI, USDC, jediPairAddresses.DAI_USDC)

export const LP_J23FEB0_J23FEB1 = new LPToken(ChainId.GÖRLI, J23FEB0,J23FEB1,jediPairAddresses.J23FEB0_J23FEB1);
export const LP_J23FEB0_J23FEB2 = new LPToken(ChainId.GÖRLI, J23FEB0,J23FEB2,jediPairAddresses.J23FEB0_J23FEB1);
export const LP_J23FEB0_J23FEB3 = new LPToken(ChainId.GÖRLI, J23FEB0,J23FEB3,jediPairAddresses.J23FEB0_J23FEB1);
export const LP_J23FEB1_J23FEB2 = new LPToken(ChainId.GÖRLI, J23FEB1,J23FEB2,jediPairAddresses.J23FEB0_J23FEB1);
export const LP_J23FEB1_J23FEB3 = new LPToken(ChainId.GÖRLI, J23FEB1,J23FEB3,jediPairAddresses.J23FEB0_J23FEB1);
export const LP_J23FEB2_J23FEB3 = new LPToken(ChainId.GÖRLI, J23FEB2,J23FEB3,jediPairAddresses.J23FEB0_J23FEB1);



// export const jediLPTokenList = {
//   [LP_ETH_WBTC.address]: LP_ETH_WBTC,
//   [LP_ETH_DAI.address]: LP_ETH_DAI,
//   [LP_ETH_USDC.address]: LP_ETH_USDC,
//   [LP_WBTC_USDC.address]: LP_WBTC_USDC,
//   [LP_DAI_USDC.address]: LP_DAI_USDC
// }

export const jediLPTokenList = [
  // LP_DAI_USDC,LP_WBTC_USDC
  LP_J23FEB0_J23FEB1,LP_J23FEB0_J23FEB2,LP_J23FEB0_J23FEB3,LP_J23FEB1_J23FEB2,LP_J23FEB1_J23FEB3,LP_J23FEB2_J23FEB3
]

export const jediLPMapping = () =>{
  const jediLPAddresses = {}
  jediTokensList.forEach((token)=>{
    jediLPAddresses[token.address]={};
  })
  jediLPAddresses[J23FEB0_ADDRESS][J23FEB1_ADDRESS]=  jediLPAddresses[J23FEB1_ADDRESS][J23FEB0_ADDRESS]=jediPairAddresses.J23FEB0_J23FEB1;
  jediLPAddresses[J23FEB0_ADDRESS][J23FEB2_ADDRESS]=  jediLPAddresses[J23FEB2_ADDRESS][J23FEB0_ADDRESS]=jediPairAddresses.J23FEB0_J23FEB2;
  jediLPAddresses[J23FEB0_ADDRESS][J23FEB3_ADDRESS]=  jediLPAddresses[J23FEB3_ADDRESS][J23FEB0_ADDRESS]=jediPairAddresses.J23FEB0_J23FEB3;

  // jediLPAddresses[WBTC_ADDRESS][USDC_ADDRESS] = jediLPAddresses[USDC_ADDRESS][WBTC_ADDRESS] = LP_WBTC_USDC;
  // jediLPAddresses[DAI_ADDRESS][USDC_ADDRESS] = jediLPAddresses[USDC_ADDRESS][DAI_ADDRESS] = LP_DAI_USDC;
  return jediLPAddresses
}
