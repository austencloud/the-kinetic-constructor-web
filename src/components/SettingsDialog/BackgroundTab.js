import React, { useState } from "react";

const BackgroundTab = () => {
  const [background, setBackground] = useState("Snowfall");

  return (
    <div>
      <h3>Background Settings</h3>
      <div style={{ display: "flex", gap: "10px" }}>
        {["Snowfall", "Stars", "Gradient"].map((option) => (
          <button
            key={option}
            style={{
              padding: "10px",
              backgroundColor: background === option ? "blue" : "white",
              color: background === option ? "white" : "black",
              border: "1px solid gray",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => setBackground(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BackgroundTab;
