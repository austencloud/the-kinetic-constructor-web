import React, { useState } from "react";
import BackgroundTab from "./BackgroundTab";
import VisibilityTab from "./VisibilityTab";
import UserProfileTab from "./UserProfileTab";

const SettingsDialog = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("Background");

  const styles = {
    dialog: {
      background: "white",
      borderRadius: "10px",
      padding: "20px",
      maxWidth: "600px",
      width: "90%",
      margin: "auto",
      position: "absolute",
      top: "20%",
      left: "50%",
      transform: "translate(-50%, -20%)",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
      zIndex: 100,
    },
    tabs: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "20px",
    },
    tabButton: {
      flex: 1,
      padding: "10px",
      cursor: "pointer",
      textAlign: "center",
      borderBottom: "2px solid transparent",
      fontWeight: activeTab ? "bold" : "normal",
    },
    tabActive: {
      borderBottom: "2px solid blue",
      color: "blue",
    },
    closeButton: {
      position: "absolute",
      top: "10px",
      right: "10px",
      cursor: "pointer",
    },
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "Background":
        return <BackgroundTab />;
      case "Visibility":
        return <VisibilityTab />;
      case "User Profile":
        return <UserProfileTab />;
      default:
        return null;
    }
  };

  return (
    <div style={styles.dialog}>
      {/* Close Button */}
      <div style={styles.closeButton} onClick={onClose}>
        ✖
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["Background", "Visibility", "User Profile"].map((tab) => (
          <div
            key={tab}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Active Tab Content */}
      {renderActiveTab()}
    </div>
  );
};

export default SettingsDialog;
