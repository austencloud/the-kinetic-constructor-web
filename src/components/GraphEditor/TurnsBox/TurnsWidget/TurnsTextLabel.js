import React from "react";

// Styles specific to TurnsTextLabel
const styles = {
  turnsTextLabel: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    textDecoration: "underline",
    textAlign: "center", // Center text inside the label
    // marginTop: "1rem", // Add margin above the label
  },
};

const TurnsTextLabel = () => {
  return <div style={styles.turnsTextLabel}>Turns</div>;
};

export default TurnsTextLabel;
