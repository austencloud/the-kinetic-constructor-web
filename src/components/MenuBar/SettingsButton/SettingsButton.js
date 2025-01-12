import React, { useState, useEffect } from "react";
import SettingsDialog from "../../SettingsDialog/SettingsDialog";
import settingsIcon from "./settings.png"; // Ensure correct relative path to your image

const SettingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonSize, setButtonSize] = useState(50); // Default button size
  const [iconSize, setIconSize] = useState(38); // Default icon size (75% of button)

  // Dynamically adjust button and icon size based on window size
  useEffect(() => {
    const updateSizes = () => {
      const newSize = Math.max(30, window.innerWidth / 24);
      setButtonSize(newSize);
      setIconSize(newSize * 0.75);
    };

    updateSizes(); // Set initial size
    window.addEventListener("resize", updateSizes);

    return () => window.removeEventListener("resize", updateSizes);
  }, []);

  const styles = {
    button: {
      width: `${buttonSize}px`,
      height: `${buttonSize}px`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      border: "none",
      cursor: "pointer",
    },
    icon: {
      width: `${iconSize}px`,
      height: `${iconSize}px`,
    },
  };

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <div>
      <button style={styles.button} onClick={handleOpen}>
        <img src={settingsIcon} alt="Settings" style={styles.icon} />
      </button>
      {isOpen && <SettingsDialog onClose={handleClose} />}
    </div>
  );
};

export default SettingsButton;
