import React from "react";
import BackgroundTab from "./BackgroundTab";
import UserProfileTab from "./UserProfileTab";
import VisibilityTab from "./VisibilityTab";

const SettingsDialog = ({ onBackgroundChange, toggles, onToggleChange }) => {
  const styles = {
    container: {
      width: "500px",
      padding: "20px",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
    },
  };

  return (
    <div style={styles.container}>
      <BackgroundTab onBackgroundChange={onBackgroundChange} />
      <UserProfileTab />
      <VisibilityTab toggles={toggles} onToggleChange={onToggleChange} />
    </div>
  );
};

export default SettingsDialog;
