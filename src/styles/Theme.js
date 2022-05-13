import {extendTheme} from "@chakra-ui/react";


const theme = extendTheme({
    fonts:{
        body:'Inter, sans-serif',
        input:'IBM Plex Mono, sans-serif',
    },
    colors: {
        brand: {
            navbar: "#070A21",
            body: "#363C72",
        },
    },
    styles: {
        global: (props) => ({
            body: {
                bg: "#070A21",
                color: "#d3d3d3",
                fontFamily:'Inter, sans-serif',
            },
            input:{
                fontFamily:'IBM Plex Mono, sans-serif',
            }
        })
    },
})

export default theme;
