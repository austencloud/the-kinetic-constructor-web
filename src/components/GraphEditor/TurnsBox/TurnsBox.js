import React from "react";
import TurnsWidget from "./TurnsWidget/TurnsWidget";

const TurnsBox = ({ color }) => {
  const boxStyles = {
    display: "flex",
    flexDirection: "column",
    border: `2px solid ${color === "blue" ? "#2E3192" : "#ED1C24"}`,
    backgroundColor: color === "blue" ? "#e6f0ff" : "#ffe6e6",
    borderRadius: "8px",
    padding: "10px",
    margin: "5px",
    flex: 1,
  };

  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "1.2rem",
  };

  return (
    <div style={boxStyles}>
      <div style={headerStyles}>
        <button>⟲</button>
        <span>{color === "blue" ? "Left" : "Right"}</span>
        <button>⟳</button>
      </div>
      <TurnsWidget color={color} />
    </div>
  );
};

export default TurnsBox;
