import '../styles/globals.css'
import type {AppProps} from 'next/app'
import {StarknetProvider} from '@starknet-react/core'
import {ChakraProvider} from "@chakra-ui/react";
import theme from '../styles/Theme'


function MyApp({Component, pageProps}: AppProps) {
  return (

    <ChakraProvider theme={theme}>

      <StarknetProvider>
        <div className={"customBackground"}>
          <Component {...pageProps} />
        </div>
      </StarknetProvider>
    </ChakraProvider>
  )
}

export default MyApp
