import React, { useState } from "react";

const DirectSetTurnsButton = ({ value, borderColor, onClick, size = "150px" }) => {
  const styles = {
    button: {
      border: `4px solid ${borderColor}`,
      borderRadius: "50%",
      width: size,
      height: size,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "white",
      cursor: "pointer",
      fontSize: `${parseFloat(size) * 0.5}px`, // Font size scales with button size
      fontWeight: "bold",
      transition: "background-color 0.3s, transform 0.2s, box-shadow 0.2s",
    },
    buttonHover: {
      backgroundColor: "#e0e7ff",
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
      transform: "scale(1.1)",
    },
    buttonActive: {
      backgroundColor: "#c7d2fe",
      boxShadow: "inset 0px 4px 8px rgba(0, 0, 0, 0.2)",
    },
  };

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  return (
    <button
      style={{
        ...styles.button,
        ...(isHovered ? styles.buttonHover : {}),
        ...(isActive ? styles.buttonActive : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onClick={onClick}
    >
      {value}
    </button>
  );
};

export default DirectSetTurnsButton;
