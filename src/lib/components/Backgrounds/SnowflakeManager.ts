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

  windStrength = 0; // Adjusted dynamically
  density = 0.0001; // Snowflake density per pixel

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
      shape: this.generateSpikySnowflake(size),
      color: this.randomSnowflakeColor(),
    };
  }

  generateSpikySnowflake(size: number): Path2D {
    const path = new Path2D();
    const spikes = 6 + Math.floor(Math.random() * 4); // 6–10 spikes
    const superSpiky = Math.random() > 0.5; // 50% chance to be super spiky

    for (let i = 0; i < spikes; i++) {
      const angle = (i * Math.PI * 2) / spikes;
      const outerX = Math.cos(angle) * size;
      const outerY = Math.sin(angle) * size;
      path.lineTo(outerX, outerY);

      const innerX = Math.cos(angle + Math.PI / spikes) * size * (superSpiky ? 0.2 : 0.5);
      const innerY = Math.sin(angle + Math.PI / spikes) * size * (superSpiky ? 0.2 : 0.5);
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
    this.snowflakes.forEach(flake => {
      ctx.save();
      ctx.translate(flake.x, flake.y);
      ctx.fillStyle = flake.color;
      ctx.globalAlpha = flake.opacity;
      ctx.fill(flake.shape);
      ctx.restore();

      flake.x += flake.sway + this.windStrength;
      flake.y += flake.speed;

      if (flake.y > height) flake.y = Math.random() * -height; // Re-enter at the top when falling out
      if (flake.x > width || flake.x < 0) flake.x = Math.random() * width;
    });
  }
}
