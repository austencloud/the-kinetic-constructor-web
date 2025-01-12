import React, { useState } from "react";
import styles from "./TurnsBoxStyles.module.css"; // Reuse the consolidated styles

const TurnsDisplayFrame = ({ color }) => {
  const [turns, setTurns] = useState(0);

  const incrementTurns = () => {
    if (turns < 3) setTurns(turns + 1);
  };

  const decrementTurns = () => {
    if (turns > 0) setTurns(turns - 1);
  };

  return (
    <div className={styles.turnsDisplayFrame}>
      <button className={styles.decrementButton} onClick={decrementTurns}>
        -
      </button>
      <div
        className={`${styles.turnsLabel} ${
          color === "blue" ? styles.blue : styles.red
        }`}
      >
        {turns}
      </div>
      <button className={styles.incrementButton} onClick={incrementTurns}>
        +
      </button>
    </div>
  );
};

export default TurnsDisplayFrame;
