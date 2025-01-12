import React, { useEffect, useState } from "react";

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

  const buttonStyles = {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    backgroundColor: "white",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transition: "background-color 0.2s",
    border: "1px solid #ccc",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  };

  const buttons = [
    {
      icon: require("./icons/add_to_dictionary.svg"),
      title: "Add to Dictionary",
      onClick: onAddToDictionary,
    },
    {
      icon: require("./icons/save_image.svg"),
      title: "Save Image",
      onClick: onSaveImage,
    },
    {
      icon: require("./icons/eye.png"),
      title: "View Full Screen",
      onClick: onViewFullScreen,
    },
    {
      icon: require("./icons/mirror.png"),
      title: "Mirror Sequence",
      onClick: onMirrorSequence,
    },
    {
      icon: require("./icons/magic_wand.svg"),
      title: "Swap Colors",
      onClick: onSwapColors,
    },
    {
      icon: require("./icons/rotate.png"),
      title: "Rotate Sequence",
      onClick: onRotateSequence,
    },
    {
      icon: require("./icons/delete.svg"),
      title: "Delete Beat",
      onClick: onDeleteBeat,
    },
    {
      icon: require("./icons/clear.svg"),
      title: "Clear Sequence",
      onClick: onClearSequence,
    },
  ];

  return (
    <div style={buttonPanelStyles}>
      {buttons.map((button, index) => (
        <React.Fragment key={index}>
          {index === 3 || index === 6 ? <div style={{ height: `${buttonSize * 0.5}px` }}></div> : null}
          <button
            style={buttonStyles}
            onClick={button.onClick}
            title={button.title}
          >
            <img
              src={button.icon}
              alt={button.title}
              style={{ width: "70%", height: "70%" }}
            />
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default SequenceWidgetButtonPanel;
