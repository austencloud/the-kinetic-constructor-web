const OptionPicker = () => {
  const styles = {
    optionPicker: {
      display: "flex",
      flexDirection: "column",
      padding: "10px",
      flex: 1,
      boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      borderLeft: "1px solid #ccc", // Add separator
    },
    title: {
      marginBottom: "10px",
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#333",
    },
    scrollArea: {
      flex: 1,
      overflowY: "auto",
      padding: "10px",
    },
    option: {
      padding: "10px",
      marginBottom: "5px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      cursor: "pointer",
      transition: "background-color 0.3s",
      width: "25%"
    },
    optionHover: {
      backgroundColor: "#e0e7ff",
    },
  };

  return (
    <div style={styles.optionPicker}>
      <h2 style={styles.title}>Options</h2>
      <div style={styles.scrollArea}>
        <div style={styles.option}>Option 1</div>
        <div style={styles.option}>Option 2</div>
        <div style={styles.option}>Option 3</div>
      </div>
    </div>
  );
};

export default OptionPicker;
