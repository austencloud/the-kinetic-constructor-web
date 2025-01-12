import React, { useEffect, useState } from "react";

const NavigationButton = ({ name, isActive, onClick }) => {
  const [styles, setStyles] = useState({});

  const updateButtonStyles = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const fontSize = Math.max(10, windowWidth / 120);
    const buttonWidth = Math.max(80, windowWidth / 10);
    const buttonHeight = Math.max(30, windowHeight / 22);

    setStyles({
      base: {
        fontSize: `${fontSize}px`,
        fontFamily: "Georgia, serif",
        padding: "5px 10px",
        borderRadius: "5px",
        border: "1px solid gray",
        cursor: "pointer",
        transition: "all 0.3s ease",
        width: `${buttonWidth}px`,
        height: `${buttonHeight}px`,
      },
      active: {
        backgroundColor: "blue",
        color: "white",
        fontWeight: "bold",
      },
      inactive: {
        backgroundColor: "white",
        color: "black",
      },
    });
  };

  useEffect(() => {
    updateButtonStyles();
    window.addEventListener("resize", updateButtonStyles);

    return () => {
      window.removeEventListener("resize", updateButtonStyles);
    };
  }, []);

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.base,
        ...(isActive ? styles.active : styles.inactive),
      }}
    >
      {name}
    </button>
  );
};

export default NavigationButton;
