import React, { useState } from "react";
import styles from "./SequenceWidgetStyles.module.css";
import GraphEditor from "../GraphEditor/GraphEditor";
import GraphEditorToggleTab from "../GraphEditor/GraphEditorToggleTab";
import SequenceWidgetButtonPanel from "./ButtonPanel/SequenceWidgetButtonPanel";

const SequenceWidget = () => {
  const [isGraphEditorExpanded, setIsGraphEditorExpanded] = useState(false);

  const graphEditorHeight = isGraphEditorExpanded ? 300 : 0; // Expanded or collapsed height
  const animationDuration = 300; // Shared animation duration in milliseconds

  // Button handlers
  const handleAddToDictionary = () => console.log("Added to dictionary");
  const handleSaveImage = () => console.log("Image saved");
  const handleViewFullScreen = () => console.log("Viewing full screen");
  const handleMirrorSequence = () => console.log("Sequence mirrored");
  const handleSwapColors = () => console.log("Colors swapped");
  const handleRotateSequence = () => console.log("Sequence rotated");
  const handleDeleteBeat = () => console.log("Beat deleted");
  const handleClearSequence = () => console.log("Sequence cleared");

  return (
    <div className={styles.sequenceWidgetContainer}>
      <div
        className={styles.sequenceWidget}
        style={{
          height: isGraphEditorExpanded
            ? "calc(100% - 300px)" // Adjust height for expanded GraphEditor
            : "calc(100% - 40px)", // Adjust height for collapsed GraphEditor
          transition: `height ${animationDuration}ms ease-in-out`,
        }}
      >
        {/* Labels */}
        <div className={styles.sequenceWidgetLabels}>
          <div className={styles.indicatorLabel}>Indicator Label</div>
          <div className={styles.currentWordLabel}>Current Word</div>
          <div className={styles.difficultyLabel}>Difficulty</div>
        </div>

        {/* Main Content Area */}
        <div className={styles.sequenceWidgetMain}>
          <div className={styles.scrollArea}>Scroll Area</div>
          <div className={styles.buttonPanel}>
            <SequenceWidgetButtonPanel
              onAddToDictionary={handleAddToDictionary}
              onSaveImage={handleSaveImage}
              onViewFullScreen={handleViewFullScreen}
              onMirrorSequence={handleMirrorSequence}
              onSwapColors={handleSwapColors}
              onRotateSequence={handleRotateSequence}
              onDeleteBeat={handleDeleteBeat}
              onClearSequence={handleClearSequence}
            />
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
