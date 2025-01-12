import React, { useState } from "react";

const SettingsButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleButtonClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <div>
      <button onClick={handleButtonClick}>Settings</button>
      {isDialogOpen && (
        <div className="settings-dialog">
          <p>Settings dialog content goes here.</p>
          <button onClick={() => setIsDialogOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default SettingsButton;
