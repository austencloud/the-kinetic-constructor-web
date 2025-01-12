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
      zIndex: 1, // Stays above other content
    },
    mainContent: {
      flex: 1, // Fills the remaining height
      display: "flex", // Horizontal layout
      flexDirection: "row", // SequenceWidget and OptionPicker side by side
      overflow: "hidden", // Prevent content overflow
    },
    sequenceWidgetContainer: {
      flex: 1, // Allocate more space to SequenceWidget
      overflow: "hidden", // Avoid scrollbars
    },
    optionPickerContainer: {
      flex: 1, // Allocate smaller space to OptionPicker
      overflowY: "auto", // Enable vertical scrolling
    },
  };

  return (
    <div id="app" style={styles.app}>
      {/* Background */}
      <SnowfallBackground background={background} />

      {/* MenuBar */}
      <div style={styles.menuBar}>
        <MenuBar onBackgroundChange={setBackground} />
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* SequenceWidget */}
        <div style={styles.sequenceWidgetContainer}>
          <SequenceWidget />
        </div>

        {/* OptionPicker */}
        <div style={styles.optionPickerContainer}>
          <OptionPicker />
        </div>
      </div>
    </div>
  );
};

export default MainWidget;
