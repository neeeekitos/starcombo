import '../styles/globals.css'
import '../../vars.css'
import type {AppProps} from 'next/app'
import {ChakraProvider, DarkMode} from "@chakra-ui/react";
import theme from '../styles/Theme'
import Navbar from "../components/Navbar";
import React from "react";
import {NotificationContainer} from 'react-notifications';

function MyApp({Component, pageProps}: AppProps) {
  return (

    <ChakraProvider theme={theme}>
      <DarkMode>
        <div className={"customBackground"}>
          <NotificationContainer/>
          <Navbar/>
          <Component {...pageProps} />
        </div>
      </DarkMode>
    </ChakraProvider>
  )
}

export default MyApp
