export enum ActionTypes {
  ADD_LIQUIDITY,
  REMOVE_LIQUIDITY,
  APPROVE,
  SWAP,
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
  AKROPOLIS
}

export const PROTOCOLS: { [key in keyof typeof ProtocolNames]?: any} = {
  [ProtocolNames.JEDISWAP]: {
    name: 'Jediswap',
    address: '0x818e6fecd516ecc3849daf6845e3ec868087b755',
    abi: []
  },
  [ProtocolNames.AAVE]: {
    name: 'Aave',
    address: '0x9B11EFD69332A98D3C2cCb8e4a8a57160D9F6A0E',
    abi: []
  },
  [ProtocolNames.ZK_LEND]: {
    name: 'ZkLend',
    address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    abi: []
  },
  [ProtocolNames.MAKER]: {
    name: 'Maker',
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    abi: []
  },
}


export const ACTIONS: { [key in keyof typeof ActionTypes]?: any} = {
  [ActionTypes.ADD_LIQUIDITY]: {
    type: ActionTypes.ADD_LIQUIDITY,
    name: 'Add Liquidity',
    availableProtocols: [
      ProtocolNames.AAVE,
      ProtocolNames.JEDISWAP,
      ProtocolNames.ZK_LEND
    ],
  },
  [ActionTypes.REMOVE_LIQUIDITY]: {
    type: ActionTypes.REMOVE_LIQUIDITY,
    name: 'Remove Liquidity',
    availableProtocols: [
      ProtocolNames.AAVE,
      ProtocolNames.JEDISWAP,
      ProtocolNames.ZK_LEND
    ],
  },
  [ActionTypes.APPROVE]: {
    type: ActionTypes.APPROVE,
    name: 'Approve',
    availableProtocols: [
      ProtocolNames.AAVE,
      ProtocolNames.JEDISWAP,
      ProtocolNames.ZK_LEND
    ],
  },
  [ActionTypes.SWAP]: {
    type: ActionTypes.SWAP,
    name: 'Swap',
    availableProtocols: [
      ProtocolNames.AAVE,
      ProtocolNames.JEDISWAP,
      ProtocolNames.ZK_LEND
    ],
  },
  [ActionTypes.REVOKE_APPROVAL]: {
    type: ActionTypes.REVOKE_APPROVAL,
    availableProtocols: [
      ProtocolNames.AAVE,
      ProtocolNames.JEDISWAP,
      ProtocolNames.ZK_LEND
    ],
  },
  [ActionTypes.TRANSFER]: {
    type: ActionTypes.TRANSFER,
    name: 'Transfer',
    availableProtocols: [
    ],
  },
  [ActionTypes.WITHDRAW]: {
    type: ActionTypes.WITHDRAW,
    name: 'Withdraw',
    availableProtocols: [
      ProtocolNames.AAVE,
    ],
  },
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

export const JEDI_ROUTER_ADDRESS = '0x01ea2f12a70ad6a052f99a49dace349996a8e968a0d6d4e9ec34e0991e6d5e5e';
