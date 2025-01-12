import React, { useEffect, useRef, useState } from "react";
import GraphEditorPictographContainer from "./GraphEditorPictographContainer";
import TurnsBox from "./TurnsBox/TurnsBox";

const GraphEditor = ({ isExpanded }) => {
  const [isFullyCollapsed, setIsFullyCollapsed] = useState(false);
  const maxEditorHeight = 300; // Fixed maximum height of the GraphEditor
  const editorRef = useRef(null);

  useEffect(() => {
    if (!isExpanded) {
      const timer = setTimeout(() => setIsFullyCollapsed(true), 300); // Match animation duration
      return () => clearTimeout(timer);
    } else {
      setIsFullyCollapsed(false);
    }
  }, [isExpanded]);

  const styles = {
    graphEditor: {
      position: "relative",
      backgroundColor: "#f4f4f4",
      borderTop: "2px solid #ccc",
      overflow: "hidden",
      width: "100%",
      height: isExpanded ? `${maxEditorHeight}px` : "0px", // Adjust height dynamically
      opacity: isFullyCollapsed ? 0 : 1, // Hide when collapsed
      transition: "height 0.3s ease-in-out, opacity 0.3s ease-in-out",
    },
    mainLayout: {
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch", // Ensure children stretch vertically
      height: "100%",
    },
    turnsBox: {
      flex: 1, // Allow TurnsBox to stretch and take equal width
      display: "flex",
    },
  };

  return (
    <div style={styles.graphEditor} ref={editorRef}>
      <div style={styles.mainLayout}>
        <div style={styles.turnsBox}>
          <TurnsBox color="blue" />
        </div>
        {/* Pass the maximum height directly */}
        <GraphEditorPictographContainer maxHeight={maxEditorHeight} />
        <div style={styles.turnsBox}>
          <TurnsBox color="red" />
        </div>
      </div>
    </div>
  );
};

export default GraphEditor;
