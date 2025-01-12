import React, { useEffect, useState } from "react";
import styles from "./GraphEditorStyles.module.css";
import GraphEditorPictographContainer from "./GraphEditorPictographContainer";
import TurnsBox from "./TurnsBox/TurnsBox";

const GraphEditor = ({ isExpanded }) => {
  const [isFullyCollapsed, setIsFullyCollapsed] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      // Wait for the collapse animation to complete before marking as fully collapsed
      const timer = setTimeout(() => setIsFullyCollapsed(true), 300); // Match animation duration
      return () => clearTimeout(timer);
    } else {
      // Reset fully collapsed state when expanded
      setIsFullyCollapsed(false);
    }
  }, [isExpanded]);

  return (
    <div
      className={styles.graphEditor}
      style={{
        height: isExpanded ? "300px" : "0px", // Collapsed height
        opacity: isFullyCollapsed ? 0 : 1, // Hide fully collapsed GraphEditor
        transition: "height 0.3s ease-in-out, opacity 0.3s ease-in-out", // Animate both height and opacity
      }}
    >
      <div className={styles.mainLayout}>
        <TurnsBox color="blue" label="Left" />
        <GraphEditorPictographContainer />
        <TurnsBox color="red" label="Right" />
      </div>
    </div>
  );
};

export default GraphEditor;
