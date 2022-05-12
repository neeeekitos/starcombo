// account is optional
import {validateAndParseAddress} from "starknet";
import isZero from "./isZero";


// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(addr: string | null | undefined): string | false {
  try {
    if (addr && !isZero(addr)) {
      const starknetAddress = validateAndParseAddress(addr)
      return starknetAddress
    }
    return false
  } catch {
    return false
  }
}