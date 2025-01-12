import React from "react";
import "./MainAppStyles.css";
import SequenceWidget from "../SequenceWidget/SequenceWidget";
import OptionPicker from "../OptionPicker/OptionPicker";
import SnowfallBackground from "../Backgrounds/SnowfallBackground";

const MainApp = () => {
  return (
    <div id="app">
      <SnowfallBackground />
      <div className="main-content">
        <header className="header">
          <div className="social-media-buttons">Social Media</div>
          <div className="navigation-buttons">Navigation</div>
          <div className="options-button">Options</div>
        </header>
        <main className="main-layout">
          <SequenceWidget />
          <OptionPicker />
        </main>
      </div>
    </div>
  );
};

// Ensure this line is present
export default MainApp;
