//Real test tokens//
import {ChainId, Token} from "@jediswap/sdk";
import {validateAndParseAddress} from "starknet";

export const WBTC_ADDRESS = validateAndParseAddress('0x12d537dc323c439dc65c976fad242d5610d27cfb5f31689a0a319b8be7f3d56');
export const DAI_ADDRESS = validateAndParseAddress('0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9');
export const USDC_ADDRESS = validateAndParseAddress('0x005a643907b9a4bc6a55e9069c4fd5fd1f5c79a22470690f75556c4736e34426');
export const ETH_ADDRESS = validateAndParseAddress('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');

export const WBTC = new Token(ChainId.GÖRLI, WBTC_ADDRESS, 8, 'WBTC', 'Wrapped BTC')
export const DAI = new Token(ChainId.GÖRLI, DAI_ADDRESS, 18, 'DAI', 'Dai')
export const USDC = new Token(ChainId.GÖRLI, USDC_ADDRESS, 6, 'USDC', 'USDC')
export const ETH = new Token(ChainId.GÖRLI, ETH_ADDRESS, 18, 'ETH', 'Ether');