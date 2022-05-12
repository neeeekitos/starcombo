import {Box, Flex} from "@chakra-ui/react";
import TokenChooser from "../token-chooser";
import {Token} from "@jediswap/sdk";
import React from "react";

interface RemoveFieldProps {
  tokenSelector:Token
  setTokenSelector:any
  amountToken:string
  protocolTokens:any
  quoteTokenSelector:Token
}

const RemoveField = (props: RemoveFieldProps) => {
  return (
      <Flex width={'100%'} justifyContent={'space-between'} alignItems={'center'}>
        <Box marginLeft={'10px'}>{props.amountToken}</Box>
        <TokenChooser
          selectedToken={props.tokenSelector}
          setSelectedToken={props.setTokenSelector}
          selectableTokens={props.protocolTokens.filter((token) => token !== props.quoteTokenSelector)}
        />
      </Flex>
  )
}

export default RemoveField