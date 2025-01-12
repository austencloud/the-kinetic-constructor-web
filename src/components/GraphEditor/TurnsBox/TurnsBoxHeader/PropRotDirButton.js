import React from "react";

const PropRotDirButton = ({ icon, color, onClick, isPressed }) => {
  const styles = {
    button: {
      width: "4rem",
      height: "4rem",
      borderRadius: "50%",
      border: `2px solid ${color}`,
      backgroundColor: isPressed ? "#ccd9ff" : "white",
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "background-color 0.3s, transform 0.2s",
      transform: isPressed ? "scale(0.95)" : "scale(1)",
    },
    icon: {
      width: "24px",
      height: "24px",
    },
  };

  return (
    <button style={styles.button} onClick={onClick}>
      <img src={icon} alt="icon" style={styles.icon} />
    </button>
  );
};

export default PropRotDirButton;
