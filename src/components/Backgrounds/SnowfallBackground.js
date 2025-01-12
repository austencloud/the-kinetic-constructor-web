import React, { useRef, useEffect } from "react";
import SnowflakeManager from "./SnowflakeManager";
import SantaManager from "./SantaManager";
import ShootingStarManager from "./ShootingStarManager";

const SnowfallBackground = () => {
  const canvasRef = useRef(null);
  const snowflakeManager = useRef(new SnowflakeManager());
  const santaManager = useRef(new SantaManager());
  const shootingStarManager = useRef(new ShootingStarManager());
  const canvasSize = useRef({ width: window.innerWidth, height: window.innerHeight });

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasSize.current;

    ctx.clearRect(0, 0, width, height);

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#142030");
    gradient.addColorStop(1, "#325078");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw and animate elements
    snowflakeManager.current.draw(ctx, width, height);
    santaManager.current.draw(ctx, width, height);
    shootingStarManager.current.manageShootingStar(width, height);
    shootingStarManager.current.animateShootingStar(width, height);
    shootingStarManager.current.draw(ctx, width, height);

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      // Only adjust positions if the canvas is expanding
      const widthChange = newWidth - canvasSize.current.width;
      const heightChange = newHeight - canvasSize.current.height;

      canvasSize.current = { width: newWidth, height: newHeight };
      canvas.width = newWidth;
      canvas.height = newHeight;

      snowflakeManager.current.adjustPositions(widthChange, heightChange);
    };

    // Initialize canvas and snowflake manager
    canvas.width = canvasSize.current.width;
    canvas.height = canvasSize.current.height;
    snowflakeManager.current.initialize(canvas.width, canvas.height, 100);
    santaManager.current.initialize(canvas.width, canvas.height);

    requestAnimationFrame(animate);

    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />;
};

export default SnowfallBackground;
