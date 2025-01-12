import React from "react";

const GraphEditorPictographContainer = ({ maxHeight }) => {
  const styles = {
    container: {
      width: `${maxHeight}px`, // Match the fixed maximum height
      height: `${maxHeight}px`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "1.2rem",
      fontWeight: "bold",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
    },
  };

  return (
    <div style={styles.container}>
      <p>Pictograph Placeholder</p>
    </div>
  );
};

export default GraphEditorPictographContainer;
