import {Token} from "@jediswap/sdk";
import {Box, Grid} from "@chakra-ui/react";

interface LockedInputProps {
  amount: string
  selectedToken: Token
}

const LockedRemoveToken = (props: LockedInputProps) => {

  return (
    <Grid templateColumns={'2fr 1fr'} width={'90%'}
          padding={'10px'}>
      <Box width='100%' marginRight={'auto'} borderBottom={'1px solid #343047'}>{props.amount}</Box>
      <Box marginLeft={'auto'} marginRight={'10px'}>{props.selectedToken.symbol}</Box>
    </Grid>
  )

}

export default LockedRemoveToken;