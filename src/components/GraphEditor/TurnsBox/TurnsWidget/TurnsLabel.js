import React from "react";

// Styles specific to TurnsLabel
const styles = {
  turnsLabel: {
    fontSize: "3rem",
    fontWeight: "bold",
    textAlign: "center",
    width: "100px",
    height: "100px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50px",
    borderWidth: "4px",
    borderStyle: "solid",
    backgroundColor: "white",
    color: "black",
    cursor: "pointer",
  },
  blue: {
    borderColor: "#2e3192",
  },
  red: {
    borderColor: "#ed1c24",
  },
};

const TurnsLabel = ({ turns, color, onClick }) => {
  return (
    <div
      style={{
        ...styles.turnsLabel,
        ...(color === "blue" ? styles.blue : styles.red),
      }}
      onClick={onClick}
    >
      {turns}
    </div>
  );
};

export default TurnsLabel;
