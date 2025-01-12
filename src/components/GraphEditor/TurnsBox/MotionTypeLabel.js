import React from "react";

// Styles specific to MotionTypeLabel
const styles = {
  motionTypeLabel: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    textAlign: "center",
  },
};

const MotionTypeLabel = () => {
  return <div style={styles.motionTypeLabel}>Motion Type</div>;
};

export default MotionTypeLabel;
