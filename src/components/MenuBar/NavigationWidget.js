import React, { useState } from "react";
import NavigationButton from "./NavigationButton";

const NavigationWidget = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabNames = [
    "Construct ⚒️",
    "Generate 🤖",
    "Browse 🔍",
    "Learn 🧠",
    "Write ✍️",
  ];

  const handleTabClick = (index) => {
    setActiveTab(index);
    if (onTabChange) {
      onTabChange(index);
    };
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
      {tabNames.map((name, index) => (
        <NavigationButton
          key={index}
          name={name}
          isActive={index === activeTab}
          onClick={() => handleTabClick(index)}
        />
      ))}
    </div>
  );
};

export default NavigationWidget;
