import React from "react";

const VisibilityTab = ({ toggles, onToggleChange }) => {
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      padding: "20px",
    },
    toggleContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "10px",
    },
    label: {
      fontWeight: "bold",
    },
    switch: {
      cursor: "pointer",
      width: "40px",
      height: "20px",
      backgroundColor: "#ccc",
      borderRadius: "10px",
      position: "relative",
      transition: "background-color 0.3s",
    },
    switchActive: {
      backgroundColor: "#4caf50",
    },
    toggle: {
      position: "absolute",
      top: "2px",
      left: "2px",
      width: "16px",
      height: "16px",
      backgroundColor: "white",
      borderRadius: "50%",
      transition: "left 0.3s",
    },
    toggleActive: {
      left: "22px",
    },
  };

  return (
    <div style={styles.container}>
      {toggles.map((toggle) => (
        <div style={styles.toggleContainer} key={toggle.label}>
          <span style={styles.label}>{toggle.label}</span>
          <div
            style={{
              ...styles.switch,
              ...(toggle.isActive ? styles.switchActive : {}),
            }}
            onClick={() => onToggleChange(toggle.label)}
          >
            <div
              style={{
                ...styles.toggle,
                ...(toggle.isActive ? styles.toggleActive : {}),
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VisibilityTab;
