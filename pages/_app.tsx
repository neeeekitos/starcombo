import '../styles/globals.css'
import '../vars.css'
import type {AppProps} from 'next/app'
import {StarknetProvider} from '@starknet-react/core'
import {ChakraProvider} from "@chakra-ui/react";
import theme from '../styles/Theme'
import Navbar from "../components/Navbar";


function MyApp({Component, pageProps}: AppProps) {
  return (

      <ChakraProvider theme={theme}>
        <StarknetProvider>
          <div className={"customBackground"}>
            <Navbar/>
            <Component {...pageProps} />
          </div>
        </StarknetProvider>
      </ChakraProvider>
  )
}

export default MyApp
