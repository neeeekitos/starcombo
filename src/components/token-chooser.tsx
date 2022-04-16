import {Button, Menu, MenuButton, MenuItem, MenuList} from "@chakra-ui/react";
//@ts-ignore
import {Btc, Usdt} from 'react-cryptocoins';
import {inspect} from "util";
import styles  from './token-chooser.module.css';
import dynamic from "next/dynamic";

const TokenChooser = (props: any) => {

  const DynamicIconComponent: any = dynamic(() => import(`react-cryptocoins/dist/icons/${props.selectedToken.symbol}`))



  return(
    <Menu>
      <MenuButton as={Button} minWidth={"6rem"} height={"3rem"}>
        <div className={styles.buttonWrapper}>
          <DynamicIconComponent size={18} fill="#1A202C"/>
          <span className={styles.buttonText}>{props.selectedToken.name}</span>
        </div>
      </MenuButton>
      <MenuList>

        {
          props.selectableTokens.map((token: any) => {
            if (token.symbol === props.selectedToken.symbol) return null;

            const DynamicIconOptionComponent: any = dynamic(() => import(`react-cryptocoins/dist/icons/${token.symbol}`))
            return(
              <MenuItem key={token.symbol} onClick={() => props.setSelectedToken(token)}>
                <div className={styles.optionWrapper}>
                  <DynamicIconOptionComponent size={18} fill="#1A202C"/>
                  <span className={styles.buttonText}>{token.name}</span>
                </div>
              </MenuItem>
            )
          })
        }
      </MenuList>
    </Menu>
  );
}
export default TokenChooser;
