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
