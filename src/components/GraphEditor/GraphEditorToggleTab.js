import React from "react";

const GraphEditorToggleTab = ({ isExpanded, onToggle, height, duration }) => {
  const styles = {
    toggleTab: {
      position: "absolute",
      bottom: `${height}px`, // Position relative to the editor height
      left: "0",
      width: "20%",
      textAlign: "center",
      padding: "10px 20px",
      background: "linear-gradient(135deg, #6a11cb, #2575fc)",
      color: "white",
      fontSize: "1rem",
      fontWeight: "bold",
      cursor: "pointer",
      borderRadius: "10px 10px 0 0",
      border: "1px solid #555",
      transition: `bottom ${duration}ms ease-in-out`, // Transition only for position
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Add shadow
    },
    icon: {
      display: "inline-block",
      transform: `rotate(${isExpanded ? 180 : 0}deg)`, // Rotate only 180 degrees
      transition: `transform ${duration}ms ease-in-out`, // Smooth rotation
    },
  };

  return (
    <div style={styles.toggleTab} onClick={onToggle}>
      <span style={styles.icon}>{isExpanded ? "▲" : "▼"}</span>{" "}
      {isExpanded ? "Collapse Editor" : "Expand Editor"}
    </div>
  );
};

export default GraphEditorToggleTab;
