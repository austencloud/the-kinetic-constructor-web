import React, { useState } from "react";
import SettingsDialog from "../SettingsDialog/SettingsDialog";

const SettingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <div>
      <button onClick={handleOpen}>Settings</button>
      {isOpen && <SettingsDialog onClose={handleClose} />}
    </div>
  );
};

export default SettingsButton;
