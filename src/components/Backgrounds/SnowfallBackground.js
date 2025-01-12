import React, { useRef, useEffect } from "react";
import SnowflakeManager from "./SnowflakeManager";
import SantaManager from "./SantaManager";
import ShootingStarManager from "./ShootingStarManager";

const SnowfallBackground = () => {
  const canvasRef = useRef(null);
  const snowflakeManager = new SnowflakeManager();
  const santaManager = new SantaManager();
  const shootingStarManager = new ShootingStarManager();

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#142030");
    gradient.addColorStop(1, "#325078");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw and animate elements
    snowflakeManager.draw(ctx, width, height);
    santaManager.draw(ctx, width, height);
    shootingStarManager.manageShootingStar(width, height);
    shootingStarManager.animateShootingStar(width, height);
    shootingStarManager.draw(ctx, width, height);

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    snowflakeManager.initialize(canvas.width, canvas.height, 100);
    santaManager.initialize(canvas.width, canvas.height);

    animate();
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />;
};

export default SnowfallBackground;
