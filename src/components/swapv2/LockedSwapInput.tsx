import {Token} from "@jediswap/sdk";
import {Box, Grid} from "@chakra-ui/react";

interface LockedInputProps {
  amount: string
  selectedToken: Token
}

const LockedSwapInput = (props: LockedInputProps) => {

  return (
    <Grid templateColumns={'2fr 1fr'} width={'90%'}
          padding={'10px'}>
      <Box width='100%' borderBottom={'1px solid #343047'} marginRight={'auto'}>{props.amount}</Box>
      <Box marginLeft={'auto'} marginRight={'10px'}>{props.selectedToken.symbol}</Box>
    </Grid>
  )

}

export default LockedSwapInput;