import React, { useState } from "react";
import DirectSetTurnsDialog from "../DirectSetTurnsDialog";

// Styles specific to TurnsDisplayFrame
const styles = {
  turnsDisplayFrame: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  turnsLabel: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    textAlign: "center",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "25px",
    border: "2px solid",
  },
  blue: {
    color: "#2e3192",
    borderColor: "#2e3192",
  },
  red: {
    color: "#ed1c24",
    borderColor: "#ed1c24",
  },
  incrementButton: {
    background: "none",
    border: "1px solid #ccc",
    cursor: "pointer",
    fontSize: "1.2rem",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  },
  decrementButton: {
    background: "none",
    border: "1px solid #ccc",
    cursor: "pointer",
    fontSize: "1.2rem",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  },
};

const TurnsDisplayFrame = ({ color }) => {
  const [turns, setTurns] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const incrementTurns = () => {
    if (turns < 3) setTurns((prev) => parseFloat(prev) + 0.5);
  };

  const decrementTurns = () => {
    if (turns > 0 || turns === "fl") {
      setTurns((prev) => (prev === "fl" ? 0 : parseFloat(prev) - 0.5));
    }
  };

  const handleSelectTurns = (value) => {
    setTurns(value === "fl" ? "fl" : parseFloat(value));
  };

  return (
    <div style={styles.turnsDisplayFrame}>
      <button style={styles.decrementButton} onClick={decrementTurns}>
        -
      </button>
      <div
        style={{
          ...styles.turnsLabel,
          ...(color === "blue" ? styles.blue : styles.red),
        }}
        onClick={() => setIsDialogOpen(true)}
      >
        {turns}
      </div>
      <button style={styles.incrementButton} onClick={incrementTurns}>
        +
      </button>

      {isDialogOpen && (
        <DirectSetTurnsDialog
          currentTurns={turns}
          onSelectTurns={handleSelectTurns}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default TurnsDisplayFrame;
