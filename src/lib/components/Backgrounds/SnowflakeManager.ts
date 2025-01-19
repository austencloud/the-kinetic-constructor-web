export default class SnowflakeManager {
  snowflakes: Array<{
    x: number;
    y: number;
    speed: number;
    size: number;
    sway: number;
    opacity: number;
    shape: Path2D;
    color: string;
  }> = [];

  windStrength = 0; // Base wind strength
  windChangeTimer = 0; // Timer to trigger wind changes
  windChangeInterval = 200; // Interval for wind changes
  density = 0.0003; // Snowflake density per pixel

  initialize(width: number, height: number) {
    const count = Math.floor(width * height * this.density);
    this.snowflakes = Array.from({ length: count }, () => this.createSnowflake(width, height));
  }

  createSnowflake(width: number, height: number) {
    const size = Math.random() * 5 + 2;
    return {
      x: Math.random() * width,
      y: Math.random() * height, // Start within the visible height of the canvas
      speed: Math.random() * 2 + 1,
      size,
      sway: Math.random() * 1 - 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      shape: this.generateSnowflake(size),
      color: this.randomSnowflakeColor(),
    };
  }

  generateSnowflake(size: number): Path2D {
    const path = new Path2D();
    const spikes = 6 + Math.floor(Math.random() * 4); // 6–10 spikes

    for (let i = 0; i < spikes; i++) {
      const angle = (i * Math.PI * 2) / spikes;
      const outerX = Math.cos(angle) * size;
      const outerY = Math.sin(angle) * size;
      path.lineTo(outerX, outerY);

      const innerX = Math.cos(angle + Math.PI / spikes) * size * 0.2;
      const innerY = Math.sin(angle + Math.PI / spikes) * size * 0.2;
      path.lineTo(innerX, innerY);
    }
    path.closePath();
    return path;
  }

  randomSnowflakeColor(): string {
    const colors = ['#FFFFFF', '#E3F2FD', '#BBDEFB', '#90CAF9'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  adjustPositions(width: number, height: number) {
    const targetCount = Math.floor(width * height * this.density);
    const difference = targetCount - this.snowflakes.length;

    if (difference > 0) {
      this.snowflakes.push(...Array.from({ length: difference }, () => this.createSnowflake(width, height)));
    } else if (difference < 0) {
      this.snowflakes.splice(0, -difference);
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.globalAlpha = 1.0;

    // Update wind strength over time
    this.windChangeTimer++;
    if (this.windChangeTimer >= this.windChangeInterval) {
      this.windChangeTimer = 0;
      this.windStrength = (Math.random() * 0.5 - 0.25) * width * 0.00005; // Random gusts
    }

    this.snowflakes.forEach(flake => {
      ctx.save();
      ctx.translate(flake.x, flake.y);
      ctx.fillStyle = flake.color;
      ctx.globalAlpha = flake.opacity;
      ctx.fill(flake.shape);
      ctx.restore();

      // Update positions
      flake.x += flake.sway + this.windStrength;
      flake.y += flake.speed;

      // Re-enter from the top with a new random x-position if it falls below the bottom
      if (flake.y > height) {
        flake.y = Math.random() * -height; // Random negative y to create staggered re-entry
        flake.x = Math.random() * width;  // Random x position
      }

      // Re-wrap horizontally if the snowflake moves out of bounds
      if (flake.x > width || flake.x < 0) {
        flake.x = Math.random() * width; // New random x position
      }
    });
  }
}
