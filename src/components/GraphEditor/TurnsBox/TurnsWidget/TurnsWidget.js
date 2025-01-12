import React from "react";
import TurnsTextLabel from "./TurnsTextLabel";
import TurnsDisplayFrame from "./TurnsDisplayFrame";
import MotionTypeLabel from "../MotionTypeLabel";

// Styles specific to TurnsWidget
const styles = {
  turnsWidget: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    width: "100%",
  },
};

const TurnsWidget = ({ color }) => {
  return (
    <div style={styles.turnsWidget}>
      <TurnsTextLabel />
      <TurnsDisplayFrame color={color} />
      <MotionTypeLabel />
    </div>
  );
};

export default TurnsWidget;
