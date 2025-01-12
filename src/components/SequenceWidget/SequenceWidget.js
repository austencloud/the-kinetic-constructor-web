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
      height: "100%",
      width: "100%",
    },
    sequenceWidget: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    sequenceWidgetMain: {
      display: "flex",
      flexDirection: "row",
      flex: 1,
    },
    sequenceWidgetLabels: {
      display: "flex",
      justifyContent: "space-around",
      padding: "10px",
    },
    scrollArea: {
      flex: 10,
      overflowY: "auto",
      padding: "10px",
    },
    buttonPanel: {
      flex: 1,
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "10px",
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
