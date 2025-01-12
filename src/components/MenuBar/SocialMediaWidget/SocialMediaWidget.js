import React, { useEffect, useState } from "react";
import PayPal from "./icons/paypal.png";
import Venmo from "./icons/venmo.png";
import GitHub from "./icons/github.png";
import Facebook from "./icons/facebook.png";
import Instagram from "./icons/instagram.png";
import YouTube from "./icons/youtube.png";

const SocialMediaWidget = () => {
  const [iconSize, setIconSize] = useState(40); // Default icon size

  useEffect(() => {
    const updateIconSize = () => {
      const baseSize = Math.min(window.innerWidth, window.innerHeight) / 50;
      setIconSize(Math.max(24, Math.min(60, baseSize))); // Set a min and max size for usability
    };

    updateIconSize();
    window.addEventListener("resize", updateIconSize);
    return () => window.removeEventListener("resize", updateIconSize);
  }, []);

  const styles = {
    container: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)", // Two rows, three columns
      gap: "10px",
      justifyContent: "center",
      alignItems: "center",
    },
    button: {
      width: `${iconSize + 16}px`, // Add padding to the icon size
      height: `${iconSize + 16}px`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: "5px",
      backgroundColor: "white",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      cursor: "pointer",
      transition: "background-color 0.3s",
    },
    buttonHover: {
      backgroundColor: "#e6e6e6",
    },
    icon: {
      width: `${iconSize}px`, // Icon size based on state
      height: `${iconSize}px`,
    },
  };

  const socialLinks = [
    { src: PayPal, alt: "PayPal", url: "https://www.paypal.me/austencloud" },
    { src: Venmo, alt: "Venmo", url: "https://venmo.com/austencloud" },
    { src: GitHub, alt: "GitHub", url: "https://github.com/austencloud/the-kinetic-constructor-web" },
    { src: Facebook, alt: "Facebook", url: "https://www.facebook.com/thekineticalphabet" },
    { src: Instagram, alt: "Instagram", url: "https://www.instagram.com/thekineticalphabet" },
    { src: YouTube, alt: "YouTube", url: "https://www.youtube.com/channel/UCbLHNRSASZS_gwkmRATH1-A" },
  ];

  const openLink = (url) => {
    window.open(url, "_blank");
  };

  return (
    <div style={styles.container}>
      {socialLinks.map((link, index) => (
        <div
          key={index}
          style={styles.button}
          onClick={() => openLink(link.url)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.button.backgroundColor)}
        >
          <img src={link.src} alt={link.alt} style={styles.icon} />
        </div>
      ))}
    </div>
  );
};

export default SocialMediaWidget;
