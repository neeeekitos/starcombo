import {Flex, Input, Text} from "@chakra-ui/react";
import TokenChooser from "../token-chooser";
import {Token} from "@jediswap/sdk";
import {Dispatch, SetStateAction} from "react";

interface AddFieldProps {
  fieldType: string;
  balance:number,
  amount: string,
  handleAmount: (e: any) => void,
  selectedToken: Token;
  tokenSelector: Token;
  setTokenSelector: Dispatch<SetStateAction<Token>>;
  quoteTokenSelector: Token;
  protocolTokens: Token[],
}

const AddField = (props:AddFieldProps) =>{
  return(
    <Flex justifyContent={'space-between'} alignItems='center' backgroundColor={'#343047'} maxWidth={'400px'}
          borderRadius={'20px'} padding={'10px'}>
      <Input width={'300px'} height={'50px'} variant={'unstyled'} marginLeft={'10px'} value={props.amount}
             onKeyPress={(event) => {
               if (!/^[0-9]+.?[0-9]*$/.test(props.amount + event.key)) {
                 event.preventDefault();
               }
             }}
             onChange={(e) => props.handleAmount(e)}>
      </Input>
      <Flex flexDir={'column'}>
        <Text marginLeft={'10px'} color={'grey'} fontSize={'sm'}>Balance : ~{props.balance?.toPrecision(6)}</Text>
        <TokenChooser selectedToken={props.tokenSelector}
                      setSelectedToken={props.setTokenSelector}
                      selectableTokens={props.protocolTokens.filter((token) => token.address !== props.quoteTokenSelector.address)}/>
      </Flex>
    </Flex>
  )
}

export default AddField