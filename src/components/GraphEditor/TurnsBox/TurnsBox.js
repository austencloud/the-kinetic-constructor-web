import React, { useState } from "react";
import TurnsBoxHeader from "./TurnsBoxHeader/TurnsBoxHeader";
import TurnsWidget from "./TurnsWidget/TurnsWidget";

const TurnsBox = ({ color }) => {
  const [isCWPressed, setIsCWPressed] = useState(false);
  const [isCCWPressed, setIsCCWPressed] = useState(false);

  const handleCWClick = () => {
    setIsCWPressed(true);
    setIsCCWPressed(false);
    console.log(`${color} prop rotation set to CW`);
  };

  const handleCCWClick = () => {
    setIsCWPressed(false);
    setIsCCWPressed(true);
    console.log(`${color} prop rotation set to CCW`);
  };

  const boxStyles = {
    container: {
      border: `4px solid ${color === "blue" ? "#2e3192" : "#ed1c24"}`,
      borderRadius: "5px",
      display: "flex",
      flexDirection: "column",
      flex: 1, // Ensure it stretches vertically
      alignSelf: "stretch", // Stretch within the parent container
      backgroundColor: "white",
    },
  };

  return (
    <div style={boxStyles.container}>
      <TurnsBoxHeader
        color={color}
        onCWClick={handleCWClick}
        onCCWClick={handleCCWClick}
        isCWPressed={isCWPressed}
        isCCWPressed={isCCWPressed}
      />
      <TurnsWidget color={color} />
    </div>
  );
};

export default TurnsBox;
