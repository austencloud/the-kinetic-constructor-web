import React, { useState } from "react";

const IncrementButton = ({ type, onClick, color }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const styles = {
    button: {
      width: "60px",
      height: "60px",
      fontSize: "2rem",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: "50%",
      cursor: "pointer",
      transition: "transform 0.2s, background-color 0.3s",
      border: `4px solid ${color === "blue" ? "#2e3192" : "#ed1c24"}`, // Dynamic border color
      backgroundColor: "white",
    },
    hovered: {
      backgroundColor: "#e6f0ff",
    },
    clicked: {
      transform: "scale(0.9)",
    },

  };

  return (
    <button
      style={{
        ...styles.button,
        ...(isHovered ? styles.hovered : {}),
        ...(isClicked ? styles.clicked : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
    >
      {type === "increment" ? "+" : "-"}
    </button>
  );
};

export default IncrementButton;
