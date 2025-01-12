import React from "react";
import PropRotDirButton from "./PropRotDirButton";
import rotateCWIcon from "./icons/rotate_cw.png"; // Import icons directly
import rotateCCWIcon from "./icons/rotate_ccw.png";

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
      padding: "10px",
      backgroundColor: "white",
      borderBottom: `2px solid ${color === "blue" ? "#2e3192" : "#ed1c24"}`,
    },
    headerLabel: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: color === "blue" ? "#2e3192" : "#ed1c24",
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
