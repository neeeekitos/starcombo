import {Percent} from "@jediswap/sdk";
import {Call} from "starknet/src/types/lib";

export enum ActionTypes {
  ADD_LIQUIDITY,
  REMOVE_LIQUIDITY,
  APPROVE,
  SWAP,
  APPROVE_AND_SWAP,
  APPROVE_AND_ADD_LIQUIDITY,
  REVOKE_APPROVAL,
  TRANSFER,
  WITHDRAW,
}

export enum ProtocolNames {
  JEDISWAP,
  AAVE,
  ZK_LEND,
  MAKER,
  STARK_SWAP,
  ZIG_ZAG,
  MY_SWAP,
  AKROPOLIS,
  ARF
}

export interface Action {
  id?: number;
  actionType: ActionTypes;
  protocolName: ProtocolNames;
  call?: Call | Call[];
}

export interface Transaction {
  contractAddress: string,
  entrypoint: string,
  calldata: string[]
}

export const PROTOCOLS: { [key in keyof typeof ProtocolNames]?: any } = {
  [ProtocolNames.JEDISWAP]: {
    name: 'Jediswap',
    address: '0x818e6fecd516ecc3849daf6845e3ec868087b755',
    abi: [],
    type: ProtocolNames.JEDISWAP,
    tokens: [
      {
        name: 'J23FEB0',
        address: '0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c',
        symbol: 'J23FEB0',
      },
      {
        name: 'J23FEB1',
        address: '0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756',
        symbol: 'J23FEB1',
      },
      {
        name: 'J23FEB2',
        address: '0x024da028e8176afd3219fbeafb17c49624af9b86dcbe81007ae40d93f741617d',
        symbol: 'J23FEB2',
      },
      {
        name: 'J23FEB3',
        address: '0x01ca5dedf1612b1ffb035e838ac09d70e500d22cf9cd0de4bebcef8553506fdb',
        symbol: 'J23FEB3',
      }
    ]


  },
  [ProtocolNames.MY_SWAP]: {
    name: 'MySwap',
    address: '0x9B11EFD69332A98D3C2cCb8e4a8a57160D9F6A0E',
    abi: [],
    type: ProtocolNames.MY_SWAP,
    tokens: [
      {
        name: 'Test Token',
        address: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
        symbol: 'TST',
      },
      {
        name: 'Test USDC',
        address: '0x44e592375a34fb4fdd3a5e2694cd2cbbcd61305b95cfac9d40c1f02ac64aa66',
        symbol: 'tUSDC',
      },
      {
        name: 'Test WETH',
        address: '0x02c03d22f43898f146e026a72f4cf37b9e898b70a11c4731665e0d75ce87700d',
        symbol: 'tWETH',
      },
      {
        name: 'Test Compound',
        address: '0x07f6e6a3b90ebe02190fba0269becaf8828b9219e92a7a041fa6da3ef11d0c6a',
        symbol: 'tCOMP',
      },


    ]
  },
  [ProtocolNames.ZK_LEND]: {
    name: 'ZkLend',
    address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    abi: [],
    type: ProtocolNames.ZK_LEND,
    tokens:[]

  },
  [ProtocolNames.ARF]: {
    name: 'AlphaRoad Finance',
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    abi: [],
    type: ProtocolNames.ARF,
    tokens:[]
  },
}


export const ACTIONS: { [key in keyof typeof ActionTypes]?: any } = {
  [ActionTypes.ADD_LIQUIDITY]: {
    type: ActionTypes.ADD_LIQUIDITY,
    name: 'Add Liquidity',
    availableProtocols: [
      ProtocolNames.MY_SWAP,
      ProtocolNames.JEDISWAP,
      ProtocolNames.ARF,
    ],
  },
  [ActionTypes.REMOVE_LIQUIDITY]: {
    type: ActionTypes.REMOVE_LIQUIDITY,
    name: 'Remove Liquidity',
    availableProtocols: [
      ProtocolNames.MY_SWAP,
      ProtocolNames.JEDISWAP,
      ProtocolNames.ARF,
    ],
  },
  [ActionTypes.SWAP]: {
    type: ActionTypes.SWAP,
    name: 'Swap',
    availableProtocols: [
      ProtocolNames.MY_SWAP,
      ProtocolNames.JEDISWAP,
      // ProtocolNames.ARF, //Not yet ?
    ],
  },
  // [ActionTypes.SWAP]: {
  //   type: ActionTypes.SWAP,
  //   name: 'Swap',
  //   availableProtocols: [
  //     ProtocolNames.AAVE,
  //     ProtocolNames.JEDISWAP,
  //     ProtocolNames.ZK_LEND
  //   ],
  // },
  // [ActionTypes.REVOKE_APPROVAL]: {
  //   type: ActionTypes.REVOKE_APPROVAL,
  //   availableProtocols: [
  //     ProtocolNames.AAVE,
  //     ProtocolNames.JEDISWAP,
  //     ProtocolNames.ZK_LEND
  //   ],
  // },
  // [ActionTypes.TRANSFER]: {
  //   type: ActionTypes.TRANSFER,
  //   name: 'Transfer',
  //   availableProtocols: [],
  // },
  // [ActionTypes.WITHDRAW]: {
  //   type: ActionTypes.WITHDRAW,
  //   name: 'Withdraw',
  //   availableProtocols: [
  //     ProtocolNames.AAVE,
  //   ],
  // },
};

export const SELECTABLE_TOKENS = [
  {
    name: 'BTC',
    address: '',
    decimals: 18,
    symbol: 'BTC',
  },
  {
    name: 'USDT',
    address: '',
    decimals: 18,
    symbol: 'USDT',
  },
  {
    name: 'ETH',
    address: '',
    decimals: 18,
    symbol: 'ETH',
  },
  {
    name: 'DAO',
    address: '',
    decimals: 18,
    symbol: 'DAO',
  },
];

export const JEDI_TOKENS = [
  {
    name: 'J23FEB0',
    address: '0x04bc8ac16658025bff4a3bd0760e84fcf075417a4c55c6fae716efdd8f1ed26c',
    decimals: 18,
    symbol: 'J23FEB0',
  },
  {
    name: 'J23FEB1',
    address: '0x05f405f9650c7ef663c87352d280f8d359ad07d200c0e5450cb9d222092dc756',
    decimals: 18,
    symbol: 'J23FEB1',
  },
  {
    name: 'J23FEB2',
    address: '0x024da028e8176afd3219fbeafb17c49624af9b86dcbe81007ae40d93f741617d',
    decimals: 18,
    symbol: 'J23FEB2',
  },
  {
    name: 'J23FEB3',
    address: '0x01ca5dedf1612b1ffb035e838ac09d70e500d22cf9cd0de4bebcef8553506fdb',
    decimals: 18,
    symbol: 'J23FEB3',
  },
];

export const MY_SWAP_ROUTER_ADDRESS = '0x071faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e';
export const JEDI_ROUTER_ADDRESS = '0x01ea2f12a70ad6a052f99a49dace349996a8e968a0d6d4e9ec34e0991e6d5e5e';
export const JEDI_REGISTRY_ADDRESS = '0x0413ba8d51ec05be863eb82314f0cf0ffceff949e76c87cae0a4bd7f89cfc2b1'
export const SLIPPAGE = new Percent('50', '10000'); // 0.5%

export const ARF_ROUTER_ADDRESS = "0x5e4aa85e37de2cd11dcce42968055a2eff1eb090de736595ae0d299001335e0";
export const ARF_FACTORY_ADDRESS = "0x0346118a027dd3bdc54ac8ac0c2b581715a6f981904542030f76eeb0e2caf8be";
