import React from "react";

const PropRotDirButton = ({ icon, color, onClick, isPressed }) => {
  const styles = {
    button: {
      width: "4rem",
      height: "4rem",
      border: `2px solid ${color}`,
      backgroundColor: isPressed ? "#ccd9ff" : "white",
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "background-color 0.3s, transform 0.2s",
      transform: isPressed ? "scale(0.95)" : "scale(1)",
      overflow: "hidden",
    },
    buttonHover: {
      backgroundColor: "#e6f0ff",
    },
    icon: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      style={{ ...styles.button, ...(isHovered && !isPressed && styles.buttonHover) }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={icon} alt="icon" style={styles.icon} />
    </button>
  );
};

export default PropRotDirButton;
