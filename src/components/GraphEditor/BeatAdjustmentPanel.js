import React, { useState } from "react";
import TurnsBox from "./TurnsBox/TurnsBox";
import OriPickerBox from "./OriPickerBox/OriPickerBox";

const BeatAdjustmentPanel = ({ graphEditor }) => {
  const [currentIndex, setCurrentIndex] = useState(0); // 0: TurnsBox, 1: OriPickerBox

  const togglePanel = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
  };

  const containerStyles = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    transition: "all 0.3s ease-in-out",
  };

  return (
    <div style={containerStyles}>
      {currentIndex === 0 ? (
        <>
          <TurnsBox color="blue" />
          <TurnsBox color="red" />
        </>
      ) : (
        <>
          <OriPickerBox color="blue" />
          <OriPickerBox color="red" />
        </>
      )}
      <button onClick={togglePanel} style={{ marginLeft: "auto", padding: "5px 10px" }}>
        Toggle
      </button>
    </div>
  );
};

export default BeatAdjustmentPanel;
