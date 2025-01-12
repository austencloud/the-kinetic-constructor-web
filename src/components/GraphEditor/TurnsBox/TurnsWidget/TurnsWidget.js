import React from "react";
import TurnsTextLabel from "./TurnsTextLabel";
import TurnsDisplayFrame from "./TurnsDisplayFrame";
import MotionTypeLabel from "./MotionTypeLabel";

const TurnsWidget = ({ color }) => {
  const widgetStyles = {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch", // Stretch child components horizontally
    gap: "10px",
    padding: "10px",
    flex: 1, // Allow widget to stretch vertically
  };

  return (
    <div style={widgetStyles}>
      <TurnsTextLabel />
      <TurnsDisplayFrame color={color} />
      <MotionTypeLabel />
    </div>
  );
};

export default TurnsWidget;
