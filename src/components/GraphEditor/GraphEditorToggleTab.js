import React from "react";
import styles from "./GraphEditorStyles.module.css";

const GraphEditorToggleTab = ({ onToggle, isExpanded, position }) => {
  return (
    <div
      className={styles.toggleTab}
      onClick={onToggle}
      style={{
        transform: `translateY(${position}px)`, // Dynamically position tab
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <p>{isExpanded ? "Collapse Editor" : "Expand Editor"}</p>
    </div>
  );
};

export default GraphEditorToggleTab;
