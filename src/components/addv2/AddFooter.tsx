import {Button, Flex, Spinner} from "@chakra-ui/react";
import React from "react";

const AddFooter = ({loading,set,setAction,unsetItem}) =>{
  return(
    <Flex justifyContent={'center'}>
      {loading &&
      <Flex alignItems={"center"}>Fetching route &nbsp; <Spinner/></Flex>
      }
      {!set && !loading &&
      <Button variant={'solid'} colorScheme={'facebook'} onClick={() => setAction()}>Set</Button>
      }
      {set &&
      <Button onClick={() => unsetItem()}>Edit</Button>
      }
    </Flex>
  )
}

export default AddFooter