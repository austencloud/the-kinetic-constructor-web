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
      transition: `bottom ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`,
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
    },
    icon: {
      display: "inline-block",
      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
      transition: `transform ${duration}ms ease-in-out`,
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
