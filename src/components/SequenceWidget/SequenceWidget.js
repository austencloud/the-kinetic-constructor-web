import React, { useState } from "react";
import GraphEditor from "../GraphEditor/GraphEditor";
import GraphEditorToggleTab from "../GraphEditor/GraphEditorToggleTab";
import SequenceWidgetButtonPanel from "./ButtonPanel/SequenceWidgetButtonPanel";

const SequenceWidget = () => {
  const [isGraphEditorExpanded, setIsGraphEditorExpanded] = useState(false);

  const graphEditorHeight = isGraphEditorExpanded ? 300 : 0; // Expanded or collapsed height
  const animationDuration = 300; // Shared animation duration in milliseconds

  const styles = {
    sequenceWidgetContainer: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      margin: "auto",
      width: "50%",
      height: "100%", // Fill parent height
    },
    sequenceWidget: {
      flex: 1, // Take up remaining vertical space
      display: "flex",
      flexDirection: "column",
      transition: `height ${animationDuration}ms ease-in-out`,
      height: isGraphEditorExpanded
        ? "calc(100% - 300px)" // Adjust height for expanded GraphEditor
        : "calc(100% - 40px)", // Adjust height for collapsed GraphEditor
    },
    sequenceWidgetLabels: {
      display: "flex",
      justifyContent: "space-around",
      padding: "10px",
    },
    sequenceWidgetMain: {
      display: "flex",
      flexDirection: "row",
      flex: 1, // Make the main area take up all available space
    },
    scrollArea: {
      flex: 10, // Occupy more space than the button panel
      overflowY: "auto",
      padding: "10px",
    },
    buttonPanel: {
      flex: 1, // Occupy less space than the scroll area
      display: "flex",
      flexWrap: "wrap", // Allow buttons to wrap to new rows
      justifyContent: "space-around", // Evenly space buttons
      alignItems: "center", // Center vertically
      padding: "10px",
      borderLeft: "1px solid #ccc", // Separate from the scroll area
    },
  };

  return (
    <div style={styles.sequenceWidgetContainer}>
      <div style={styles.sequenceWidget}>
        {/* Labels */}
        <div style={styles.sequenceWidgetLabels}>
          <div>Indicator Label</div>
          <div>Current Word</div>
          <div>Difficulty</div>
        </div>

        {/* Main Content Area */}
        <div style={styles.sequenceWidgetMain}>
          <div style={styles.scrollArea}>Scroll Area</div>
          <div style={styles.buttonPanel}>
            <SequenceWidgetButtonPanel />
          </div>
        </div>
      </div>

      {/* ToggleTab */}
      <GraphEditorToggleTab
        onToggle={() => setIsGraphEditorExpanded(!isGraphEditorExpanded)}
        isExpanded={isGraphEditorExpanded}
        height={graphEditorHeight} // Dynamically adjust height
        duration={animationDuration}
      />

      {/* GraphEditor */}
      <GraphEditor isExpanded={isGraphEditorExpanded} />
    </div>
  );
};

export default SequenceWidget;
