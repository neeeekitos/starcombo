import {useState} from "react";
import styles from "../components/token-chooser.module.css";
import {Button, Menu, MenuButton, MenuItem, MenuList} from "@chakra-ui/react";
import {ACTIONS, PROTOCOLS} from "../utils/constants/constants";

const AddAction = (props: any) => {

  const [selectedAction, setAction] = useState(Object.values(ACTIONS)[0]);
  const [selectedProtocol, setProtocol] = useState(PROTOCOLS[selectedAction.availableProtocols[0]]);

  return (
    <div>
      <Menu>
        <MenuButton as={Button} minWidth={"6rem"} height={"3rem"}>
          <div className={styles.buttonWrapper}>
            <span className={styles.buttonText}>{selectedAction.name}</span>
          </div>
        </MenuButton>
        <MenuList>
          {Object.keys(ACTIONS).map((actionKey: string) => {
            return (
              <MenuItem
                key={actionKey}
                onClick={() => {
                  setAction(ACTIONS[actionKey]);
                }}
              >
                {ACTIONS[actionKey].name}
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
      <Menu>
        <MenuButton as={Button} minWidth={"6rem"} height={"3rem"}>
          <div className={styles.buttonWrapper}>
            <span className={styles.buttonText}>{selectedProtocol.name}</span>
          </div>
        </MenuButton>
        <MenuList>
          {selectedAction.availableProtocols.map((protocolKey: string) => {
            return (
              <MenuItem
                key={protocolKey}
                onClick={() => {
                  setProtocol(PROTOCOLS[protocolKey]);
                }}
              >
                {PROTOCOLS[protocolKey].name}
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>

      <Button onClick={() => props.onAddAction({
        id: props.newId,
        actionType: selectedAction.type,
        protocolName: selectedProtocol.type,
      })}>Add new Action</Button>
    </div>
  );
}
export default AddAction;
