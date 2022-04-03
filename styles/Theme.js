import {extendTheme} from "@chakra-ui/react";


const theme = extendTheme({
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
            }
        })
    },
})

export default theme;
