import React from "react";
import styles from "./select-new-action.module.css";
import {ACTIONS, PROTOCOLS} from "../../utils/constants/constants";

const SelectNewAction = (props: any) => {

  return (
    <div className={styles.modalWrapper}>
      <div className={styles.modalContent}>
        <h1 className={styles.titleAddAction}>Add new action</h1>

        {
          Object.keys(PROTOCOLS).map((protocolKey: string) => {
              return (
                <>
                  <h3 className={PROTOCOLS[protocolKey].stylesTitle}>{PROTOCOLS[protocolKey].name}:</h3>
                  <div className={styles.listAction}>
                    {
                      PROTOCOLS[protocolKey].availableAction.map((actionKey: string) => {
                        console.log(actionKey + " " + ACTIONS[actionKey])
                        return (
                          <>
                            <div className={PROTOCOLS[protocolKey].stylesCard}
                                 onClick={() => {props.onAddAction({
                                   id: props.newId,
                                   actionType: ACTIONS[actionKey].type,
                                   protocolName: PROTOCOLS[protocolKey].type,
                                 });
                                 props.setIsComponentVisible(false)
                                 }}>
                              <p>{ACTIONS[actionKey].name}</p>
                            </div>
                          </>
                        )
                      })
                    }
                  </div>
                </>
              );
            }
          )}

      </div>

    </div>
  )
}


export default SelectNewAction;