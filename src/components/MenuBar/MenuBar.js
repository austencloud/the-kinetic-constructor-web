import React, { useState } from "react";
import SocialMediaWidget from "./SocialMediaWidget/SocialMediaWidget";
import NavigationWidget from "./NavigationWidget";
import SettingsButton from "./SettingsButton";

const MenuBar = () => {
  const styles = {
    menuBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: "white",
      padding: "10px 20px",
      position: "sticky",
      top: 0,
      left: 0,
      zIndex: 10,
    },
  };

  return (
    <header style={styles.menuBar}>
      <SocialMediaWidget />
      <NavigationWidget />
      <SettingsButton />
    </header>
  );
};

export default MenuBar;
