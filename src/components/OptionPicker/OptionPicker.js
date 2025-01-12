import React from "react";

const styles = {
  optionPicker: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #ccc',
    backgroundColor: 'transparent',
    padding: '10px',
    flex: 1,
    width: '100%',
  },
  title: {
    marginBottom: '10px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  scrollArea: {
    flex:1,
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: 'transparent',
    width: '100%',
  },
  option: {
    padding: '10px',
    marginBottom: '5px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  optionHover: {
    backgroundColor: '#e9e9e9',
  }
};

const OptionPicker = () => {
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
