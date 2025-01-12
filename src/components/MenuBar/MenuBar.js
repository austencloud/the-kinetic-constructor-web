import React from "react";
import SocialMediaWidget from "./SocialMediaWidget/SocialMediaWidget";
import NavigationWidget from "./NavigationWidget";
import SettingsButton from "./SettingsButton/SettingsButton";

const MenuBar = ({ onTabChange }) => {
  const styles = {
    menuBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: "white",
      width: "100%",
    },
  };

  return (
    <header style={styles.menuBar}>
      <SocialMediaWidget />
      <NavigationWidget onTabChange={onTabChange} />
      <SettingsButton />
    </header>
  );
};

export default MenuBar;
