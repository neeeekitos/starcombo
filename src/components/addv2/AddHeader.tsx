import {Box, Flex, Text} from "@chakra-ui/react";
import {DeleteIcon} from "@chakra-ui/icons";
import React from "react";
import {Action} from "../../utils/constants/constants";

interface AddHeaderProps{
  protocolName: string | any,
  handleRemoveAction: (number) => void
  action: Action;
}

const AddHeader= ({protocolName,handleRemoveAction,action}:AddHeaderProps) =>{
  return (
    <Flex justifyContent={'space-between'}>
      <Text margin='8px' marginLeft={'15px'}>
        Add liquidity on {protocolName}
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

export default AddHeader