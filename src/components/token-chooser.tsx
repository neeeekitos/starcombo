import {Box, Button, Flex, Menu, MenuButton, MenuItem, MenuList, Text} from "@chakra-ui/react";
//@ts-ignore
import {Btc, Usdt} from 'react-cryptocoins';
import {inspect} from "util";
import styles from './token-chooser.module.css';
import dynamic from "next/dynamic";
import {Token} from "@jediswap/sdk";
import {ChevronDownIcon} from "@chakra-ui/icons";

const TokenChooser = (props: any) => {

  const DynamicIconComponent: any = dynamic(() => import(`react-cryptocoins/dist/icons/${props.selectedToken.symbol}`))


  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} borderRadius={'15px'}>
          <Text justifySelf={'center'} fontSize={'sm'}>{props.selectedToken.symbol}</Text>
      </MenuButton>
      <MenuList>
        {
          Object.values(props.selectableTokens).map((token: Token) => {
            if (token.symbol === props.selectedToken.symbol) return null;

            const DynamicIconOptionComponent: any = dynamic(() => import(`react-cryptocoins/dist/icons/${token.symbol}`))
            return (
              <MenuItem key={token.symbol} onClick={() => props.setSelectedToken(token)}>
                <Box>
                  {/*<DynamicIconOptionComponent size={18} fill="#1A202C"/>*/}
                  <Text fontSize={'sm'}>{token.name}</Text>
                </Box>
              </MenuItem>
            )
          })
        }
      </MenuList>
    </Menu>
  );
}
export default TokenChooser;
