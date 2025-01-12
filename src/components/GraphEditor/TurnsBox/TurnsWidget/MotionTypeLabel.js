import React from "react";

// Styles specific to MotionTypeLabel
const styles = {
  motionTypeLabel: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    textAlign: "center", // Center text inside the label
    marginBottom: "1rem", // Add margin below the label
  },
};

const MotionTypeLabel = () => {
  return <div style={styles.motionTypeLabel}>Motion Type</div>;
};

export default MotionTypeLabel;
