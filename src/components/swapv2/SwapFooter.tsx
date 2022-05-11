import {Button, Flex, Spinner} from "@chakra-ui/react";
import React from "react";

const SwapFooter = ({loading,set,setAction,unsetItem}) => {

  return (
    <Flex justifyContent={'center'}>
      {loading &&
      <Flex alignItems={"center"}>Fetching route &nbsp; <Spinner/></Flex>
      }
      {!set && !loading &&
      <Button variant={'solid'} colorScheme={'facebook'} onClick={() => setAction()}>Set</Button>
      }
    </Flex>
  )
}

export default SwapFooter;