import React, { useState } from "react";
import MenuBar from "../MenuBar/MenuBar";
import SequenceWidget from "../SequenceWidget/SequenceWidget";
import OptionPicker from "../OptionPicker/OptionPicker";
import SnowfallBackground from "../Backgrounds/SnowfallBackground";

const MainWidget = () => {
  const [background, setBackground] = useState("Snowfall");

  const styles = {
    app: {
      display: "flex",
      flexDirection: "column",
      height: "100vh", // Full viewport height
      width: "100vw", // Full viewport width
      position: "relative", // Ensure background positioning works
    },
    menuBar: {
      flex: "0 0 auto", // Fixed height for the menu bar
      zIndex: 1, // Ensure it's above other content
    },
    mainContent: {
      flex: 1, // Fill remaining height
      display: "flex", // Horizontal layout for children
      flexDirection: "row", // SequenceWidget and OptionPicker side-by-side
      overflow: "hidden", // Prevent layout spilling
    },
    sequenceWidgetContainer: {
      flex: 4, // Allocate 4x space compared to the OptionPicker
    },
    optionPickerContainer: {
      flex: 1, // Allocate 1x space for the OptionPicker
      borderLeft: "1px solid #ccc", // Separator
    },
  };

  return (
    <div id="app" style={styles.app}>
      <SnowfallBackground background={background} />
      <MenuBar onBackgroundChange={setBackground} />
      <div style={styles.mainContent}>
        <div style={styles.sequenceWidgetContainer}>
          <SequenceWidget />
        </div>
        <div style={styles.optionPickerContainer}>
          <OptionPicker />
        </div>
      </div>
    </div>
  );
};

export default MainWidget;
