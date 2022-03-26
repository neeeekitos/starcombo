import type { NextPage } from 'next'
import {Box, Flex, Text, chakra, ButtonGroup, Button, Heading} from "@chakra-ui/react";
import Link from 'next/link'
import Navbar from "../components/Navbar";
import Main from "./Main";

const Home: NextPage = () => {
  return (
    <>
     <Navbar/>
      <Main/>
    </>
  )
}

export default Home
