const SequenceWidgetButton = ({
  icon,
  title,
  onClick,
  isHovered,
  isClicked,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  buttonSize,
}) => {
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
    boxShadow: isClicked
      ? "inset 0px 2px 4px rgba(0, 0, 0, 0.2)"
      : "0px 2px 4px rgba(0, 0, 0, 0.1)",
    transform: isClicked ? "scale(0.9)" : isHovered ? "scale(1.1)" : "scale(1)",
    boxSizing: "border-box",
    padding: "0",
  };

  const iconStyles = {
    width: "70%", // Maintain aspect ratio inside button
    height: "70%",
    objectFit: "contain",
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
      <img src={icon} alt={title} style={iconStyles} />
    </button>
  );
};

export default SequenceWidgetButton;
