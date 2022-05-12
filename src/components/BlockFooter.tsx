import {Button, Flex, Icon, Spinner} from "@chakra-ui/react";
import React from "react";
import {AiOutlineStop} from "react-icons/ai";

const BlockFooter = ({loading,set,setAction,disabled}) =>{
  return(
    <Flex justifyContent={'center'}>
      {loading &&
      <Flex alignItems={"center"}>Fetching route &nbsp; <Spinner/></Flex>
      }
      {!set && !loading &&
      <Button variant={'solid'} disabled={disabled} colorScheme={'facebook'} onClick={() => setAction()}>
        {disabled? <Icon as={AiOutlineStop}/> : <span>Set</span>}
        </Button>
      }
    </Flex>
  )
}

export default BlockFooter;