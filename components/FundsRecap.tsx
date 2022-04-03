import {useAmounts} from "../hooks/useAmounts";
import {Flex, Heading} from "@chakra-ui/react";

const FundsRecap = () => {

  const {initialFunds, receivedFunds} = useAmounts()
  return (
    <>
      { (Object.keys(initialFunds).length!==0 || Object.keys(receivedFunds).length !== 0) &&
      <Flex flexDir={"column"} width={"300px"} border={"0.1px solid white"} borderRadius={"10px"} padding={"10px"}>
        <Flex flexDir={"column"}>
          <Heading as={"h1"} size={"md"}>Initial funds</Heading>
          {Object.entries(initialFunds).map(([key, value]) => {
            return (
              <Flex marginLeft={"20px"} justifyContent={"space-between"} key={key}>
                <Flex>{key}</Flex>
                <Flex>{value}</Flex>
              </Flex>
            )
          })}
        </Flex>
        <Flex flexDir={"column"}>
          <Heading as={"h2"} size={"sm"}>Received funds</Heading>
          {Object.entries(receivedFunds).map(([key, value]) => {
            return (
              <Flex marginLeft={"20px"} justifyContent={"space-between"} key={key}>
                <Flex>{key}</Flex>
                <Flex> ~ {value}</Flex>
              </Flex>
            )
          })}
        </Flex>
      </Flex>
      }

    </>
  )
}

export default FundsRecap;