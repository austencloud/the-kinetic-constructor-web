const Button = ({ icon, title, onClick, isHovered, isClicked, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, buttonSize }) => {
    const buttonStyles = {
      width: `${buttonSize}px`,
      height: `${buttonSize}px`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isHovered ? "#f0f0f0" : "white",
      borderRadius: "50%",
      cursor: "pointer",
      transition: "background-color 0.2s, transform 0.2s",
      border: "1px solid #ccc",
      fontSize: `${buttonSize * 0.5}px`, // Adjust icon size
      transform: isClicked ? "scale(0.9)" : isHovered ? "scale(1.1)" : "scale(1)",
    };
  
    return (
      <button
        style={buttonStyles}
        onClick={onClick}
        title={title}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {icon}
      </button>
    );
  };
  
export default Button;