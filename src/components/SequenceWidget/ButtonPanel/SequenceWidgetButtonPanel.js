import React, { useState, useEffect } from "react";
import SequenceWidgetButton from "./SequenceWidgetButton";

const SequenceWidgetButtonPanel = () => {
  const [buttonSize, setButtonSize] = useState(60); // Default size
  const [hoveredButton, setHoveredButton] = useState(null);
  const [clickedButton, setClickedButton] = useState(null);

  const buttons = [
    { icon: require("./icons/add_to_dictionary.png"), title: "Add to Dictionary", id: "addToDictionary" },
    { icon: require("./icons/save_image.png"), title: "Save Image", id: "saveImage" },
    { icon: require("./icons/eye.png"), title: "View Full Screen", id: "viewFullScreen" },
    { icon: require("./icons/mirror.png"), title: "Mirror Sequence", id: "mirrorSequence" },
    { icon: require("./icons/yinyang1.png"), title: "Swap Colors", id: "swapColors" },
    { icon: require("./icons/rotate.png"), title: "Rotate Sequence", id: "rotateSequence" },
    { icon: require("./icons/delete.png"), title: "Delete Beat", id: "deleteBeat" },
    { icon: require("./icons/clear.png"), title: "Clear Sequence", id: "clearSequence" },
  ];

  useEffect(() => {
    const updateButtonSize = () => {
      const containerWidth = window.innerWidth;
      setButtonSize(Math.max(40, Math.min(80, containerWidth / 34))); // Dynamically adjust size
    };

    updateButtonSize();
    window.addEventListener("resize", updateButtonSize);
    return () => window.removeEventListener("resize", updateButtonSize);
  }, []);

  const styles = {
    buttonPanel: {
      flex: 1, // Occupy less space compared to the scroll area
      display: "flex",
      flexWrap: "wrap", // Allow buttons to wrap to new rows
      justifyContent: "center", // Align buttons closer to the center
      alignItems: "center", // Center vertically
      gap: "5px", // Tighter spacing between buttons
      padding: "5px", // Reduce overall padding
    },
    buttonContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: `${buttonSize * 0.3}px`, // Dynamically adjust gaps based on button size
    },
  };

  return (
    <div style={styles.buttonPanel}>
      <div style={styles.buttonContainer}>
        {buttons.map((button) => (
          <SequenceWidgetButton
            key={button.id}
            icon={button.icon}
            title={button.title}
            onClick={() => console.log(`${button.title} clicked`)}
            isHovered={hoveredButton === button.id}
            isClicked={clickedButton === button.id}
            onMouseEnter={() => setHoveredButton(button.id)}
            onMouseLeave={() => setHoveredButton(null)}
            onMouseDown={() => setClickedButton(button.id)}
            onMouseUp={() => setClickedButton(null)}
            buttonSize={buttonSize}
          />
        ))}
      </div>
    </div>
  );
};

export default SequenceWidgetButtonPanel;
