import React from "react";

const GraphEditorToggleTab = ({ onToggle, isExpanded, position }) => {
  const styles = {
    toggleTab: {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "20%",
      textAlign: "center",
      padding: "10px 20px", // More padding for a prominent look
      background: "linear-gradient(135deg, #6a11cb, #2575fc)", // Gradient background
      color: "white",
      fontSize: "1rem",
      fontWeight: "bold",
      cursor: "pointer",
      borderRadius: "10px 10px 0 0", // Rounded top corners
      border: "1px solid #555",
      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
      transform: `translateY(${position}px) scale(1)`, // Combine position and scale
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Adds depth
    },
    hover: {
      scale: "1.05", // Use scale only for the hover effect
      boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)", // Increased shadow
    },
    icon: {
      display: "inline-block",
      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", // Rotate icon based on state
      transition: "transform 0.3s ease-in-out",
    },
  };

  return (
    <div
      style={{
        ...styles.toggleTab,
      }}
      onClick={onToggle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `translateY(${position}px) scale(${styles.hover.scale})`;
        e.currentTarget.style.boxShadow = styles.hover.boxShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `translateY(${position}px) scale(1)`; // Reset scale
        e.currentTarget.style.boxShadow = styles.toggleTab.boxShadow; // Reset shadow
      }}
    >
      <span style={styles.icon}>
        {isExpanded ? "▲" : "▼"} {/* Icon changes dynamically */}
      </span>{" "}
      {isExpanded ? "Collapse Editor" : "Expand Editor"}
    </div>
  );
};

export default GraphEditorToggleTab;
