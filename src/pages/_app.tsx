import '../styles/globals.css'
import '../../vars.css'
import type {AppProps} from 'next/app'
import {ChakraProvider} from "@chakra-ui/react";
import theme from '../styles/Theme'
import Navbar from "../components/Navbar";


function MyApp({Component, pageProps}: AppProps) {
  return (

      <ChakraProvider theme={theme}>
          <div className={"customBackground"}>
            <Navbar/>
            <Component {...pageProps} />
          </div>
      </ChakraProvider>
  )
}

export default MyApp
