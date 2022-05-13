import {Percent} from "@jediswap/sdk";
import {Call} from "starknet/src/types/lib";
import {JediSwap} from "../../protocols/Jediswap/jediSwap";
import {MySwap} from "../../protocols/Myswap/mySwap";
import styles from "../../components/select-new-action/select-new-action.module.css";
import {jediTokensList} from "../../protocols/Jediswap/constants/jediTokens";
import {myswapTokenList} from "../../protocols/Myswap/constants/myswapTokens";

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000'


export enum ActionTypes {
  ADD_LIQUIDITY,
  REMOVE_LIQUIDITY,
  SWAP,
  TRANSFER,
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
  details?:any;
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
    stylesTitle: styles.jediSwap,
    stylesCard: styles.cardJediSwap,
    availableAction: [
      ActionTypes.SWAP,
      ActionTypes.ADD_LIQUIDITY,
      ActionTypes.REMOVE_LIQUIDITY
    ],
    tokens:jediTokensList,
    instance:JediSwap.getInstance(),


  },
  [ProtocolNames.MY_SWAP]: {
    name: 'MySwap',
    address: '0x9B11EFD69332A98D3C2cCb8e4a8a57160D9F6A0E',
    abi: [],
    type: ProtocolNames.MY_SWAP,
    stylesTitle: styles.mySwap,
    stylesCard: styles.cardMySwap,
    availableAction: [
      ActionTypes.SWAP,
      ActionTypes.ADD_LIQUIDITY,
      ActionTypes.REMOVE_LIQUIDITY
    ],
    tokens:myswapTokenList,
    instance:MySwap.getInstance(),
  },
  // [ProtocolNames.ZK_LEND]: {
  //   name: 'ZkLend',
  //   address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  //   abi: [],
  //   type: ProtocolNames.ZK_LEND,
  //   tokens:[]
  //
  // },
  [ProtocolNames.ARF]: {
    name: 'AlphaRoad Finance',
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    abi: [],
    type: ProtocolNames.ARF,
    tokens:[],
    stylesTitle: styles.alphaRoad,
    stylesCard: styles.cardAlpha,
    availableAction: [
      // ActionTypes.SWAP,
      // ActionTypes.ADD_LIQUIDITY,
      // ActionTypes.REMOVE_LIQUIDITY
    ],
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

export const MY_SWAP_ROUTER_ADDRESS = '0x071faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e';
export const JEDI_ROUTER_ADDRESS = '0x01ea2f12a70ad6a052f99a49dace349996a8e968a0d6d4e9ec34e0991e6d5e5e';
export const JEDI_ROUTER_ADDRESS_2 = '0x16adfcc056a7d1f654feb7493b59853bef1442f109645dd97d433f71a1f6ee7';
export const JEDI_REGISTRY_ADDRESS = '0x0413ba8d51ec05be863eb82314f0cf0ffceff949e76c87cae0a4bd7f89cfc2b1';
export const JEDI_REGISTRY_ADDRESS_2 = '0x1a8c2876e13ebf0e2f23cc1109ad6dfd722c0bd2dbf50721ce8ad91f98c1bef';
export const SLIPPAGE = new Percent('50', '10000'); // 0.5%

export const ARF_ROUTER_ADDRESS = "0x5e4aa85e37de2cd11dcce42968055a2eff1eb090de736595ae0d299001335e0";
export const ARF_FACTORY_ADDRESS = "0x0346118a027dd3bdc54ac8ac0c2b581715a6f981904542030f76eeb0e2caf8be";
