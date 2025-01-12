import React from "react";
import styles from "./TurnsBoxStyles.module.css"; // Reuse the consolidated styles
import TurnsTextLabel from "./TurnsTextLabel";
import MotionTypeLabel from "./MotionTypeLabel";
import TurnsDisplayFrame from "./TurnsDisplayFrame";

const TurnsWidget = ({ color }) => {
  return (
    <div className={styles.turnsWidget}>
      <TurnsTextLabel />
      <TurnsDisplayFrame color={color} />
      <MotionTypeLabel />
    </div>
  );
};

export default TurnsWidget;
