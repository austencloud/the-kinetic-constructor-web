import React from "react";

const NavigationWidget = () => {
  const styles = {
    container: {
      display: "flex",
      justifyContent: "space-around",
      width: "100%",
    },
    link: {
      color: "white",
      textDecoration: "none",
      fontWeight: "bold",
      padding: "0 10px",
    },
  };

  return (
    <div style={styles.container}>
      <a href="#home" style={styles.link}>
        Home
      </a>
      <a href="#features" style={styles.link}>
        Features
      </a>
      <a href="#contact" style={styles.link}>
        Contact
      </a>
    </div>
  );
};

export default NavigationWidget;
