import {InjectedConnector, useStarknet} from "@starknet-react/core";
import {Button, Heading} from "@chakra-ui/react";



const Account = () => {
  const { account, connect } = useStarknet()
  return (
    <div>
      <Heading>Account</Heading>
      <div>
        <p>Connected Account: {account}</p>
      </div>
      {InjectedConnector.ready ? (
        <div>
          <Button onClick={() => connect(new InjectedConnector())}>Connect Argent-X</Button>
        </div>
      ) : (
        <div>
          <p>
            <a href="https://github.com/argentlabs/argent-x">Download Argent-X</a>
          </p>
        </div>
      )}
    </div>
  )
}
export default Account