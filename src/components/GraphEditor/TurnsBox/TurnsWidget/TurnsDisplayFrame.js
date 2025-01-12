import React, { useState } from "react";
import IncrementButton from "./IncrementButton";
import DirectSetTurnsDialog from "../DirectSetTurnsDialog";
import TurnsLabel from "./TurnsLabel";

const styles = {
  turnsDisplayFrame: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-evenly", // Ensure buttons are spaced evenly
    width: "100%", // Stretch to full width of the parent container
    flex: 1, // Allow it to take vertical space if needed
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
      <IncrementButton type="decrement" onClick={decrementTurns} color={color} />
      <TurnsLabel
        turns={turns}
        color={color}
        onClick={() => setIsDialogOpen(true)}
      />
      <IncrementButton type="increment" onClick={incrementTurns} color={color} />
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
