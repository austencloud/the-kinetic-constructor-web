import React from "react";

const BackgroundTab = ({ onBackgroundChange }) => {
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
    },
    title: {
      marginBottom: "10px",
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    buttonContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
    },
    button: {
      padding: "10px 20px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      cursor: "pointer",
      backgroundColor: "#f4f4f4",
      transition: "background-color 0.3s",
    },
    buttonHover: {
      backgroundColor: "#ddd",
    },
  };

  const backgrounds = ["Snowfall", "Stars", "Gradient"];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Select Background</h2>
      <div style={styles.buttonContainer}>
        {backgrounds.map((background) => (
          <button
            key={background}
            style={styles.button}
            onClick={() => onBackgroundChange(background)}
          >
            {background}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BackgroundTab;
