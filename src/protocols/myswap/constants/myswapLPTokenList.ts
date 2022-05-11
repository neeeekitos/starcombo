import {
  myswapTokenList,
  TCOMP,
  TCOMP_ADDRESS,
  TST,
  TST_ADDRESS,
  TUSDC,
  TUSDC_ADDRESS,
  TWETH_ADDRESS
} from "./myswapTokens";

export const myswapPoolIds = {
  TST_TUSDC: 4,
  TST_TCOMP: undefined,
  TST_TWETH: 3,
  TUSDC_TWETH: 1,
  TUSDC_TCOMP: 2,
  TWETH_TCOMP:undefined,
}

// export const LP_WBTC_USDC = new LPToken(ChainId.GÖRLI, WBTC, USDC, myswapPoolIds.WBTC_USDC)
//
// export const LP_DAI_USDC = new LPToken(ChainId.GÖRLI, DAI, USDC, myswapPoolIds.DAI_USDC)
//
//
// export const myswapLpTokenList = [
//   LP_DAI_USDC,LP_WBTC_USDC
// ]

export const myswapLpMapping = () =>{
  const lpAddresses = {}
  myswapTokenList.forEach((token)=>{
    lpAddresses[token.address]={};
  })
  lpAddresses[TST_ADDRESS][TUSDC_ADDRESS]=  lpAddresses[TUSDC_ADDRESS][TST_ADDRESS]=myswapPoolIds.TST_TUSDC;
  lpAddresses[TST_ADDRESS][TWETH_ADDRESS]=  lpAddresses[TWETH_ADDRESS][TST_ADDRESS]=myswapPoolIds.TST_TWETH;
  lpAddresses[TST_ADDRESS][TCOMP_ADDRESS]=  lpAddresses[TCOMP_ADDRESS][TST_ADDRESS]=myswapPoolIds.TST_TCOMP;
  lpAddresses[TUSDC_ADDRESS][TWETH_ADDRESS]=  lpAddresses[TWETH_ADDRESS][TUSDC_ADDRESS]=myswapPoolIds.TUSDC_TWETH;
  lpAddresses[TUSDC_ADDRESS][TCOMP_ADDRESS]=  lpAddresses[TCOMP_ADDRESS][TUSDC_ADDRESS]=myswapPoolIds.TUSDC_TCOMP;
  lpAddresses[TWETH_ADDRESS][TCOMP_ADDRESS] = lpAddresses[TCOMP_ADDRESS][TWETH_ADDRESS]=myswapPoolIds.TWETH_TCOMP;
  return lpAddresses
}
