import React from "react";

const DirectSetTurnsDialog = ({ currentTurns, onSelectTurns, onClose }) => {
  const turnsValues = ["fl", "0", "0.5", "1", "1.5", "2", "2.5", "3"];

  const dialogStyle = {
    position: "absolute",
    border: "2px solid #2e3192",
    borderRadius: "5px",
    backgroundColor: "white",
    display: "flex",
    gap: "5px",
    padding: "10px",
    fontSize: "16px",
  };

  const turnsButtonStyle = {
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "5px 10px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "16px",
  };

  const turnsButtonHoverStyle = {
    backgroundColor: "#f0f0f0",
  };

  return (
    <div style={dialogStyle}>
      {turnsValues.map((value) => (
        <button
          key={value}
          style={turnsButtonStyle}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor =
              turnsButtonHoverStyle.backgroundColor)
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor =
              turnsButtonStyle.backgroundColor)
          }
          onClick={() => {
            onSelectTurns(value);
            onClose();
          }}
        >
          {value}
        </button>
      ))}
    </div>
  );
};

export default DirectSetTurnsDialog;
