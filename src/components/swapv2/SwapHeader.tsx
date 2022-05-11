import {Box, Flex, Text} from "@chakra-ui/react"
import {DeleteIcon, SettingsIcon} from "@chakra-ui/icons";
import styles from "../action-block-swap/action-block.module.css";
import React from "react";
import {Action} from "../../utils/constants/constants";

interface SwapHeaderProps {
  protocolName: string | any,
  handleRemoveAction: () => void
  action: Action;
}

const SwapHeader = ({protocolName, handleRemoveAction, action}) => {
  console.log(protocolName)
  return (
    <Flex justifyContent={'space-between'}>
      <Text margin='8px' marginLeft={'15px'}>
        Swap on {protocolName}
      </Text>
      {/*<SettingsIcon margin={'8px'} marginRight={'15px'}/>*/}
      <Box padding={'6px'} cursor={'pointer'}
           onClick={(e) => {
             e.stopPropagation();
             handleRemoveAction(action.id)
           }}>
        <DeleteIcon/>
      </Box>
    </Flex>
  )
}

export default SwapHeader