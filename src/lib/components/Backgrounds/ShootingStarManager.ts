// src/lib/components/Backgrounds/ShootingStarManager.ts
import { AnimationComponent } from './AnimationComponent';

/**
 * Manages shooting star animations
 * Refactored to extend AnimationComponent
 */
export default class ShootingStarManager extends AnimationComponent {
  shootingStar: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    speed: number;
    tail: { x: number; y: number; size: number; color: string }[];
    prevX: number;
    prevY: number;
    tailLength: number;
    opacity: number;
    offScreen: boolean;
    color: string;
    twinkle: boolean;
  } | null = null;

  timer: number = 0;
  interval: number;

  constructor() {
    super();
    this.interval = this.getInterval();
  }

  /**
   * Get a random interval time for shooting star appearances
   */
  private getInterval(): number {
    return this.randomInt(1000, 1500); // Adjusted for debugging (set to 1000+ in production)
  }

  /**
   * Get a random color for the shooting star
   */
  private getRandomColor(): string {
    const colors = ['#FFD700', '#FFFFFF', '#FFA500', '#00FFFF'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Initialize the shooting star manager
   * Implements abstract method from AnimationComponent
   */
  initialize(width: number, height: number): void {
    // Initialization happens when stars are spawned
    this.timer = 0;
    this.interval = this.getInterval();
    this.initialized = true;
  }

  /**
   * Spawn a new shooting star
   */
  spawnShootingStar(width: number, height: number): void {
    const middleY = height / 2;

    // Initial position (from left or right)
    const startOptions = [
      { x: -0.1 * width, y: this.randomFloat(0.2, 0.8) * height }, // Left
      { x: 1.1 * width, y: this.randomFloat(0.2, 0.8) * height }   // Right
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
      size: this.randomFloat(3, 5), // Smaller maximum size
      speed: this.randomFloat(0.02, 0.05),
      tail: [],
      prevX: startPos.x,
      prevY: startPos.y,
      tailLength: this.randomInt(10, 20), // Shorter tail length
      opacity: 1.0,
      offScreen: false,
      color: this.getRandomColor(),
      twinkle: Math.random() < 0.5 // 50% chance of twinkling effect
    };
  }

  /**
   * Animate the shooting star for the next frame
   * Implements abstract method from AnimationComponent
   */
  animate(width: number, height: number): void {
    // Check if we should render based on performance before processing animation
    if (!this.shouldRender()) return;
    
    // Manage shooting star timing
    this.timer += 1;
    if (!this.shootingStar && this.timer >= this.interval) {
      this.spawnShootingStar(width, height);
      this.timer = 0;
      this.interval = this.getInterval();
    }
    
    // Animate existing shooting star
    if (!this.shootingStar) return;

    const star = this.shootingStar;
    const newX = star.x + star.dx * star.speed * width;
    const newY = star.y + star.dy * star.speed * height;

    // Add interpolated positions to make the tail denser
    const steps = 50; // Increased for denser tail
    for (let i = 0; i < steps; i++) {
      const interpX = star.prevX + (newX - star.prevX) * (i / steps);
      const interpY = star.prevY + (newY - star.prevY) * (i / steps);
      star.tail.push({
        x: interpX,
        y: interpY,
        size: star.size * 0.8, // Keep tail segments slightly smaller
        color: star.color
      });
    }

    // Move the star
    star.prevX = star.x;
    star.prevY = star.y;
    star.x = newX;
    star.y = newY;

    // Mark off-screen stars
    if (
      star.x < -width * 0.1 ||
      star.x > width * 1.1 ||
      star.y < -height * 0.1 ||
      star.y > height * 1.1
    ) {
      star.offScreen = true;
    }

    // Fade out off-screen stars
    if (star.offScreen) {
      star.opacity -= 0.02;
      if (star.opacity <= 0) this.shootingStar = null;
    }

    // Trim tail length
    if (star.tail.length > star.tailLength * steps) {
      star.tail.splice(0, steps); // Remove multiple segments at once
    }
  }

  /**
   * Draw the shooting star to the canvas
   * Implements abstract method from AnimationComponent
   */
  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Check if we should render based on performance
    if (!this.shouldRender() || !this.shootingStar) return;

    const star = this.shootingStar;

    // Draw tail
    ctx.save();
    const tailLength = star.tail.length;

    star.tail.forEach((segment, index) => {
      // Make opacity fall off faster, closer to the star
      const fadeFactor = 5; // Higher values fade out quicker near the star
      const opacity = Math.max(0, ((index + 1) / tailLength) ** fadeFactor * star.opacity);

      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(segment.x, segment.y, segment.size, 0, Math.PI * 2);
      ctx.fillStyle = segment.color;
      ctx.fill();
    });
    ctx.restore();

    // Draw head
    ctx.save();
    ctx.globalAlpha = star.opacity;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = star.color;

    // Twinkling effect
    if (star.twinkle && Math.random() > 0.5) {
      ctx.shadowColor = star.color;
      ctx.shadowBlur = star.size / 2;
    }

    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 1.0;
  }
}