// src/lib/components/Backgrounds/SantaManager.ts
import { AnimationComponent } from './AnimationComponent';

/**
 * Manages Santa animation for seasonal effects
 * Refactored to extend AnimationComponent
 */
export default class SantaManager extends AnimationComponent {
  private static instance: SantaManager | null = null;
  
  santaImage: HTMLImageElement | null = null;
  imageLoaded: boolean = false;
  santa: {
    x: number;
    y: number;
    speed: number;
    active: boolean;
    direction: number;
    opacity: number;
  } = { x: 0, y: 0, speed: 0, active: false, direction: 1, opacity: 1 };
  santaTimer: number = 0;
  santaInterval: number;

  private constructor() {
    super();
    this.santaInterval = this.randomInt(1200, 1500);
    this.loadSantaImage();
  }

  /**
   * Get the singleton instance of SantaManager
   */
  static getInstance(): SantaManager {
    if (!this.instance) {
      this.instance = new SantaManager();
    }
    return this.instance;
  }

  /**
   * Load the Santa image
   */
  private loadSantaImage() {
    // Only load in December and in browser environment
    if (typeof window !== 'undefined' && this.isDecember()) {
      this.santaImage = new Image();
      this.santaImage.src = 'santa.png';
      
      // Use promises for better error handling
      this.santaImage.onload = () => {
        this.imageLoaded = true;
        // Optional: Pre-render or cache the image
        this.preRenderSanta();
      };
      this.santaImage.onerror = () => {
        console.error('Failed to load Santa image');
        // Fallback mechanism or error tracking
      };
    }
  }

  /**
   * Optional method to pre-render the Santa image for optimization
   */
  private preRenderSanta() {
    if (!this.santaImage) return;

    // Create an offscreen canvas to pre-render and optimize Santa image
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    
    if (!offscreenCtx) return;

    // Potentially pre-scale or apply filters to the image
    offscreenCanvas.width = this.santaImage.width;
    offscreenCanvas.height = this.santaImage.height;
    offscreenCtx.drawImage(this.santaImage, 0, 0);
    
    // Additional optimizations could be applied here
  }

  /**
   * Check if the current month is December
   */
  private isDecember(): boolean {
    return new Date().getMonth() === 11; // 11 = December
  }

  /**
   * Initialize Santa animation
   * Implements abstract method from AnimationComponent
   */
  initialize(width: number, height: number) {
    this.santa = { 
      x: -0.2, 
      y: 0.2, 
      speed: 0.001, 
      active: false, 
      direction: 1, 
      opacity: 0.8 
    };
    this.santaTimer = 0;
    this.santaInterval = this.randomInt(200, 300);
    this.initialized = true;
  }

  /**
   * Animate Santa for the next frame
   * Implements abstract method from AnimationComponent
   */
  animate(width: number, height: number) {
    // Skip if performance is low or it's not December
    if (!this.shouldRender() || !this.isDecember()) return;

    if (this.santa.active) {
      this.santa.x += this.santa.speed * this.santa.direction;
      if (
        (this.santa.direction === 1 && this.santa.x > 1.2) ||
        (this.santa.direction === -1 && this.santa.x < -0.2)
      ) {
        this.santa.active = false;
        this.santaTimer = 0;
      }
    } else {
      this.santaTimer++;
      if (this.santaTimer >= this.santaInterval) {
        this.santa.active = true;
        this.santa.direction = Math.random() < 0.5 ? -1 : 1;
        this.santa.x = this.santa.direction === 1 ? -0.2 : 1.2;
        this.santa.y = Math.random() * 0.2 + 0.1;
        this.santa.speed = Math.random() * 0.001 + 0.001;
        this.santaInterval = this.randomInt(1200, 1500);
      }
    }
  }

  /**
   * Draw Santa to the canvas
   * Implements abstract method from AnimationComponent
   */
  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Skip if performance is low, it's not December, or Santa isn't active
    if (!this.shouldRender() || !this.isDecember()) return;
    if (!this.santa.active || !this.imageLoaded || !this.santaImage) return;

    const santaWidth = Math.max(50, Math.min(width * 0.05, 100));
    const scalingFactor = santaWidth / this.santaImage.width;
    const santaHeight = this.santaImage.height * scalingFactor;

    const x = this.santa.x * width;
    const y = this.santa.y * height;

    ctx.save();
    ctx.globalAlpha = this.santa.opacity;

    if (this.santa.direction === 1) {
      ctx.drawImage(this.santaImage, x, y, santaWidth, santaHeight);
    } else {
      ctx.translate(x + santaWidth, y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.santaImage, 0, 0, santaWidth, santaHeight);
    }

    ctx.restore();
  }
}