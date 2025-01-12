import React from "react";
import styles from "./GraphEditorStyles.module.css";

const TurnsBox = ({ color }) => {
  return (
    <div
      className={`${styles.turnsBox} ${
        color === "blue" ? styles.blueBox : styles.redBox
      }`}
    >
      <p>{color === "blue" ? "Blue Turns Box" : "Red Turns Box"}</p>
    </div>
  );
};

export const BlueTurnsBox = () => <TurnsBox color="blue" />;
export const RedTurnsBox = () => <TurnsBox color="red" />;
