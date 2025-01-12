import React from "react";

const OriPickerBox = ({ color }) => {
  const boxStyles = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    border: `2px dashed ${color === "blue" ? "#2E3192" : "#ED1C24"}`,
    backgroundColor: color === "blue" ? "#e6f0ff" : "#ffe6e6",
    borderRadius: "8px",
    padding: "20px",
    flex: 1,
    height: "100%",
  };

  return (
    <div style={boxStyles}>
      <p>Orientation Picker for {color === "blue" ? "Left" : "Right"}</p>
    </div>
  );
};

export default OriPickerBox;
