import React from "react";

// Styles specific to TurnsTextLabel
const styles = {
  turnsTextLabel: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    textDecoration: "underline",
  },
};

const TurnsTextLabel = () => {
  return <div style={styles.turnsTextLabel}>Turns</div>;
};

export default TurnsTextLabel;
