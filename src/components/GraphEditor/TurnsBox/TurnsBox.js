import React from "react";
import styles from "./TurnsBoxStyles.module.css";
import TurnsWidget from "./TurnsWidget";

const TurnsBox = ({ color }) => {
  return (
    <div
      className={`${styles.turnsBox} ${
        color === "blue" ? styles.blueBox : styles.redBox
      }`}
    >
      <div className={styles.header}>
        <button className={styles.rotateButton}>⟲</button>
        <span className={styles.headerLabel}>
          {color === "blue" ? "Left" : "Right"}
        </span>
        <button className={styles.rotateButton}>⟳</button>
      </div>
      <TurnsWidget color={color} />
    </div>
  );
};

export default TurnsBox;
