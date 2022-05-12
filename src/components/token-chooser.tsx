import {Box, Button, Menu, MenuButton, MenuItem, MenuList, Text} from "@chakra-ui/react";
//@ts-ignore
import {Btc, Usdt} from 'react-cryptocoins';
import dynamic from "next/dynamic";
import {Token} from "@jediswap/sdk";
import {ChevronDownIcon} from "@chakra-ui/icons";

const TokenChooser = (props: any) => {

  const DynamicIconComponent: any = dynamic(() => import(`react-cryptocoins/dist/icons/${props.selectedToken.symbol}`))


  return (
    <Box alignSelf={'flex-end'}>
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon/>} borderRadius={'15px'}>
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
    </Box>
  );
}
export default TokenChooser;
