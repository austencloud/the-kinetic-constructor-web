import React from "react";
import PropRotDirButton from "./PropRotDirButton";
import rotateCWIcon from "./icons/clockwise.png"; // Import icons directly
import rotateCCWIcon from "./icons/counter_clockwise.png";

const TurnsBoxHeader = ({
  color,
  onCWClick,
  onCCWClick,
  isCWPressed,
  isCCWPressed,
}) => {
  const headerStyles = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "5px",
      borderBottom: `2px solid ${color === "blue" ? "#2e3192" : "#ed1c24"}`,
    },
    headerLabel: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: color === "blue" ? "#2e3192" : "#ed1c24",
      transition: "color 0.3s", // Add transition for color change
    },
  };

  const iconPaths = {
    clockwise: rotateCWIcon,
    counterClockwise: rotateCCWIcon,
  };

  return (
    <div style={headerStyles.container}>
      <PropRotDirButton
        icon={iconPaths.counterClockwise}
        color={color === "blue" ? "#2e3192" : "#ed1c24"}
        onClick={onCCWClick}
        isPressed={isCCWPressed}
      />
      <span style={headerStyles.headerLabel}>
        {color === "blue" ? "Left" : "Right"}
      </span>
      <PropRotDirButton
        icon={iconPaths.clockwise}
        color={color === "blue" ? "#2e3192" : "#ed1c24"}
        onClick={onCWClick}
        isPressed={isCWPressed}
      />
    </div>
  );
};

export default TurnsBoxHeader;
