import React, { useEffect, useState } from "react";
import DirectSetTurnsButton from "./DirectSetTurnsButton";

const DirectSetTurnsDialog = ({
  currentTurns,
  onSelectTurns,
  onClose,
  color,
}) => {
  const turnsValues = ["fl", "0", "0.5", "1", "1.5", "2", "2.5", "3"];
  const borderColor = color === "blue" ? "#2e3192" : "#ed1c24";

  const [buttonSize, setButtonSize] = useState("80px");

  useEffect(() => {
    const updateButtonSize = () => {
      const dialogWidth = window.innerWidth * 0.4; // Adjust based on screen width (40% of screen width)
      const calculatedSize = Math.min(dialogWidth / 4 - 20, 80); // Ensure buttons fit in a 4-column layout
      setButtonSize(`${calculatedSize}px`);
    };

    updateButtonSize();
    window.addEventListener("resize", updateButtonSize);
    return () => window.removeEventListener("resize", updateButtonSize);
  }, []);

  const styles = {
    dialog: {
      position: "absolute",
      border: `4px solid ${borderColor}`,
      borderRadius: "10px",
      backgroundColor: "#ffffff",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "15px",
      // padding: "20px",
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      fontSize: "18px",
    },
  };

  return (
    <div style={styles.dialog}>
      {turnsValues.map((value) => (
        <DirectSetTurnsButton
          key={value}
          value={value}
          borderColor={borderColor}
          size={buttonSize} // Pass dynamic button size
          onClick={() => {
            onSelectTurns(value);
            onClose(); // Ensure the dialog closes after a button click
          }}
        />
      ))}
    </div>
  );
};

export default DirectSetTurnsDialog;
