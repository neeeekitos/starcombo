import {Box, Flex, Text} from "@chakra-ui/react"
import {DeleteIcon, EditIcon} from "@chakra-ui/icons";
import React from "react";
import {Action} from "../utils/constants/constants";

interface SwapHeaderProps {
  protocolName: string | any,
  handleRemoveAction: (number) => void
  action: Action;
  set: boolean
  type:string
  unsetItem:()=>void
}

const BlockHeader = ({type,protocolName, handleRemoveAction, action, set,unsetItem}: SwapHeaderProps) => {
  return (
    <Flex justifyContent={'space-between'}>
      <Text margin='8px' marginLeft={'15px'}>
        {type} on {protocolName}
      </Text>
      {/*<SettingsIcon margin={'8px'} marginRight={'15px'}/>*/}
      <Flex flexDir={'row'} alignItems={'center'}>
        {set && <Box padding={'6px'} cursor={'pointer'} onClick={() => unsetItem()}>
          <EditIcon/>
        </Box>}
        <Box padding={'6px'} cursor={'pointer'}
             onClick={(e) => {
               e.stopPropagation();
               handleRemoveAction(action.id)
             }}>
          <DeleteIcon/>
        </Box>
      </Flex>
    </Flex>
  )
}

export default BlockHeader