class SnowflakeManager {
  constructor() {
    this.snowflakes = [];
  }

  initialize(width, height, count) {
    for (let i = 0; i < count; i++) {
      this.snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: Math.random() * 2 + 1,
        size: Math.random() * 3 + 1,
        sway: Math.random() * 2 - 1,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
  }

  draw(ctx, width, height) {
    // console.log("Drawing Snowflakes"); // Debug log
    this.snowflakes.forEach((flake, index) => {
      // console.log(`Snowflake[${index}] Opacity: ${flake.opacity}`); // Log individual opacity
      ctx.globalAlpha = flake.opacity;
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      flake.x += flake.sway;
      flake.y += flake.speed;

      // Reset if out of bounds
      if (flake.y > height) flake.y = -flake.size;
      if (flake.x > width || flake.x < 0) flake.x = Math.random() * width;
    });

    ctx.globalAlpha = 1.0; // Reset alpha
  }
}

export default SnowflakeManager;
