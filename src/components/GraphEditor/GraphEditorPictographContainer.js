import React from "react";

const GraphEditorPictographContainer = ({ height }) => {
  const styles = {
    container: {
      width: `${height}px`, // Match the height
      height: `${height}px`,
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
