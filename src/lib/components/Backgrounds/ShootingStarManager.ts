export default class ShootingStarManager {
  shootingStar: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    speed: number;
    tail: { x: number; y: number; size: number }[];
    prevX: number;
    prevY: number;
    tailLength: number;
    opacity: number;
    offScreen: boolean;
  } | null = null;

  timer: number = 0;
  interval: number;

  constructor() {
    this.interval = this.randomInt(1100, 1500);
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  spawnShootingStar(width: number, height: number): void {
    const middleY = height / 2;

    // Initial position (from left or right)
    const startOptions = [
      { x: -0.1 * width, y: this.randomFloat(0.2, 0.8) * height }, // Left
      { x: 1.1 * width, y: this.randomFloat(0.2, 0.8) * height }, // Right
    ];
    const startPos = startOptions[Math.floor(Math.random() * startOptions.length)];

    // Direction and speed
    let dx = this.randomFloat(0.3, 0.5) * (startPos.x > 0 ? -1 : 1); // Left or right
    let dy = Math.random() < 0.5 ? -this.randomFloat(0.05, 0.2) : this.randomFloat(0.05, 0.2);

    // Adjust to gravitate towards the middle
    if (startPos.y > middleY) dy -= this.randomFloat(0.02, 0.05);
    else dy += this.randomFloat(0.02, 0.05);

    // Normalize the direction vector
    const norm = Math.sqrt(dx * dx + dy * dy);
    dx /= norm;
    dy /= norm;

    this.shootingStar = {
      x: startPos.x,
      y: startPos.y,
      dx: dx,
      dy: dy,
      size: this.randomFloat(5, 10),
      speed: this.randomFloat(0.03, 0.06),
      tail: [],
      prevX: startPos.x,
      prevY: startPos.y,
      tailLength: 30,
      opacity: 1.0,
      offScreen: false,
    };
  }

  animateShootingStar(width: number, height: number): void {
    if (!this.shootingStar) return;

    const star = this.shootingStar;
    const newX = star.x + star.dx * star.speed * width;
    const newY = star.y + star.dy * star.speed * height;

    // Generate interpolated tail positions
    const steps = 25;
    for (let i = 0; i < steps; i++) {
      const interpX = star.prevX + (newX - star.prevX) * (i / steps);
      const interpY = star.prevY + (newY - star.prevY) * (i / steps);
      star.tail.push({ x: interpX, y: interpY, size: star.size });
    }

    star.prevX = star.x;
    star.prevY = star.y;
    star.x = newX;
    star.y = newY;

    // Mark off-screen stars
    if (star.x < -width * 0.1 || star.x > width * 1.1 || star.y < -height * 0.1 || star.y > height * 1.1) {
      star.offScreen = true;
    }

    // Fade out off-screen stars
    if (star.offScreen) {
      star.opacity -= 0.05;
      if (star.opacity <= 0) this.shootingStar = null;
    }

    // Trim tail length
    if (star.tail.length > star.tailLength) {
      star.tail.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.shootingStar) return;

    const star = this.shootingStar;

    // Draw tail
    ctx.save();
    const tailLength = star.tail.length;
    star.tail.forEach((segment, index) => {
      const opacity = ((index + 1) / tailLength) * star.opacity;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(segment.x, segment.y, segment.size * opacity, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    });
    ctx.restore();

    // Draw head
    ctx.save();
    ctx.globalAlpha = star.opacity;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 1.0;
  }

  manageShootingStar(width: number, height: number): void {
    this.timer += 1;
    if (!this.shootingStar && this.timer >= this.interval) {
      this.spawnShootingStar(width, height);
      this.timer = 0;
      this.interval = this.randomInt(1100, 1500);
    }
  }
}
