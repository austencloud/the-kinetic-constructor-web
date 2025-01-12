import React from "react";
import styles from "./OptionPickerStyles.module.css";

const OptionPicker = () => {
  return (
    <div className={styles.optionPicker}>
      <h2 className={styles.title}>Options</h2>
      <div className={styles.scrollArea}>
        <div className={styles.option}>Option 1</div>
        <div className={styles.option}>Option 2</div>
        <div className={styles.option}>Option 3</div>
      </div>
    </div>
  );
};

export default OptionPicker;
