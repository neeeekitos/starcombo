import React from "react";
import styles from "./select-new-action.module.css";
import {ACTIONS, PROTOCOLS} from "../../utils/constants/constants";
import {Image} from "@chakra-ui/image";

const SelectNewAction = (props: any) => {

  return (
    <div className={styles.modalWrapper}>
      <div className={styles.modalContent}>
        <h1 className={styles.titleAddAction}>Add block</h1>

        {
          Object.keys(PROTOCOLS).map((protocolKey: string) => {
              return (
                <div key={protocolKey}>
                  {PROTOCOLS[protocolKey].logo && <Image src={PROTOCOLS[protocolKey].logo}/>}
                  <h3 className={PROTOCOLS[protocolKey].stylesTitle}>{PROTOCOLS[protocolKey].name}:</h3>
                  <div className={styles.listAction}>
                    {
                      PROTOCOLS[protocolKey].availableAction.map((actionKey: string) => {
                        return (
                          <div key={`${PROTOCOLS[protocolKey].name}-${actionKey}`}>
                            <div
                                 className={PROTOCOLS[protocolKey].stylesCard}
                                 onClick={() => {
                                   props.onAddAction({
                                     id: props.newId,
                                     actionType: ACTIONS[actionKey].type,
                                     protocolName: PROTOCOLS[protocolKey].type,
                                   });
                                   props.setIsComponentVisible(false)
                                 }}>
                              <p>{ACTIONS[actionKey].name}</p>
                            </div>
                          </div>
                        )
                      })
                    }
                    {PROTOCOLS[protocolKey].availableAction.length === 0 &&
                    <div className={PROTOCOLS[protocolKey].stylesCard}
                    >
                      <p>Coming soon</p>
                    </div>
                    }
                  </div>
                </div>
              );
            }
          )}
      </div>
    </div>
  )
}


export default SelectNewAction;