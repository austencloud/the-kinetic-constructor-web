import React from "react";
import TurnsWidget from "./TurnsWidget/TurnsWidget";

const styles = {
  turnsBox: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #ddd',
    padding: '10px',
    flex: 1,
  },
  blueBox: {
    borderColor: '#2e3192',
    backgroundColor: '#e6f0ff',
  },
  redBox: {
    borderColor: '#ed1c24',
    backgroundColor: '#ffe6e6',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px',
    marginBottom: '10px',
  },
  rotateButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
  },
  headerLabel: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
};

const TurnsBox = ({ color }) => {
  return (
    <div
      style={{
        ...styles.turnsBox,
        ...(color === "blue" ? styles.blueBox : styles.redBox),
      }}
    >
      <div style={styles.header}>
        <button style={styles.rotateButton}>⟲</button>
        <span style={styles.headerLabel}>
          {color === "blue" ? "Left" : "Right"}
        </span>
        <button style={styles.rotateButton}>⟳</button>
      </div>
      <TurnsWidget color={color} />
    </div>
  );
};

export default TurnsBox;
