import React, { useEffect, useState } from "react";
import Button from "./Button";

const SequenceWidgetButtonPanel = ({
  onAddToDictionary,
  onSaveImage,
  onViewFullScreen,
  onMirrorSequence,
  onSwapColors,
  onRotateSequence,
  onDeleteBeat,
  onClearSequence,
}) => {
  const [buttonSize, setButtonSize] = useState(50); // Default size
  const [hoveredButton, setHoveredButton] = useState(null); // Track hovered button
  const [clickedButton, setClickedButton] = useState(null); // Track clicked button

  useEffect(() => {
    const updateButtonSize = () => {
      const containerHeight = window.innerHeight;
      const newSize = Math.max(40, Math.min(80, containerHeight / 20));
      setButtonSize(newSize);
    };

    updateButtonSize();
    window.addEventListener("resize", updateButtonSize);
    return () => window.removeEventListener("resize", updateButtonSize);
  }, []);

  const buttonPanelStyles = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: `${buttonSize * 0.2}px`,
    padding: "10px",
    height: "100%",
    width: "100%",
  };

  const buttons = [
    {
      icon: require("./icons/add_to_dictionary.png"),
      title: "Add to Dictionary",
      onClick: onAddToDictionary,
      id: "addToDictionary",
    },
    {
      icon: require("./icons/save_image.png"),
      title: "Save Image",
      onClick: onSaveImage,
      id: "saveImage",
    },
    {
      icon: require("./icons/eye.png"),
      title: "View Full Screen",
      onClick: onViewFullScreen,
      id: "viewFullScreen",
    },
    {
      icon: require("./icons/mirror.png"),
      title: "Mirror Sequence",
      onClick: onMirrorSequence,
      id: "mirrorSequence",
    },
    {
      icon: require("./icons/yinyang1.png"),
      title: "Swap Colors",
      onClick: onSwapColors,
      id: "swapColors",
    },
    {
      icon: require("./icons/rotate.png"),
      title: "Rotate Sequence",
      onClick: onRotateSequence,
      id: "rotateSequence",
    },
    {
      icon: require("./icons/delete.png"),
      title: "Delete Beat",
      onClick: onDeleteBeat,
      id: "deleteBeat",
    },
    {
      icon: require("./icons/clear.png"),
      title: "Clear Sequence",
      onClick: onClearSequence,
      id: "clearSequence",
    },
  ];

  return (
    <div style={buttonPanelStyles}>
      {buttons.map((button, index) => (
        <React.Fragment key={button.id}>
          {/* Spacer between groups */}
          {index === 3 || index === 6 ? (
            <div style={{ height: `${buttonSize * 0.5}px` }}></div>
          ) : null}
          <Button
            icon={button.icon}
            title={button.title}
            onClick={button.onClick}
            isHovered={hoveredButton === button.id}
            isClicked={clickedButton === button.id}
            onMouseEnter={() => setHoveredButton(button.id)}
            onMouseLeave={() => setHoveredButton(null)}
            onMouseDown={() => setClickedButton(button.id)}
            onMouseUp={() => setClickedButton(null)}
            buttonSize={buttonSize}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

export default SequenceWidgetButtonPanel;
