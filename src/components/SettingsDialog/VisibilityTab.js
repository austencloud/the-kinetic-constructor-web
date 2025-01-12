import React, { useState } from "react";

const VisibilityTab = () => {
  const [visibilityOptions, setVisibilityOptions] = useState([
    { label: "Show Grid", isActive: true },
    { label: "Show Labels", isActive: false },
    { label: "Show Annotations", isActive: true },
  ]);

  const toggleOption = (label) => {
    setVisibilityOptions((prev) =>
      prev.map((option) =>
        option.label === label
          ? { ...option, isActive: !option.isActive }
          : option
      )
    );
  };

  return (
    <div>
      <h3>Visibility Settings</h3>
      {visibilityOptions.map((option) => (
        <div key={option.label} style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={option.isActive}
              onChange={() => toggleOption(option.label)}
            />
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default VisibilityTab;
