// src/lib/components/Backgrounds/SnowflakeManager.ts
import { AnimationComponent } from './AnimationComponent';
import { AnimationConfig } from './AnimationConfig';

/**
 * Manages snowflake animations
 * Refactored to extend AnimationComponent with improved performance handling
 */
export default class SnowflakeManager extends AnimationComponent {
  // Snowflake properties
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
  
  // Wind properties
  windStrength = 0;
  windChangeTimer = 0;
  windChangeInterval = AnimationConfig.snowflake.windChangeInterval;
  
  // Density configuration with adaptive performance scaling
  baseDensity = AnimationConfig.snowflake.density; 
  currentDensity = this.baseDensity;
  
  /**
   * Initialize the snowflake manager with given dimensions
   */
  initialize(width: number, height: number) {
    // Adjust density based on device capability
    this.updateDensity();
    
    const count = Math.floor(width * height * this.currentDensity);
    this.snowflakes = Array.from({ length: count }, () => this.createSnowflake(width, height));
    this.initialized = true;
  }
  
  /**
   * Create a snowflake with random properties
   */
  createSnowflake(width: number, height: number) {
    const size = this.randomFloat(
      AnimationConfig.snowflake.minSize, 
      AnimationConfig.snowflake.maxSize
    );
    
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      speed: this.randomFloat(
        AnimationConfig.snowflake.minSpeed, 
        AnimationConfig.snowflake.maxSpeed
      ),
      size,
      sway: Math.random() * 1 - 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      shape: this.generateSnowflake(size),
      color: this.randomSnowflakeColor(),
    };
  }
  
  /**
   * Generate a snowflake shape
   */
  generateSnowflake(size: number): Path2D {
    const path = new Path2D();
    const spikes = 6 + Math.floor(Math.random() * 4);
    
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
  
  /**
   * Select a random color for a snowflake
   */
  randomSnowflakeColor(): string {
    return AnimationConfig.snowflake.colors[
      Math.floor(Math.random() * AnimationConfig.snowflake.colors.length)
    ];
  }
  
  /**
   * Update snowflake density based on performance
   */
  updateDensity() {
    const status = this.performanceTracker.getPerformanceStatus();
    
    // Always show some snowflakes, even on low performance devices
    if (status.isCriticalPerformance) {
      // Reduce to 20% density on very low performance devices
      this.currentDensity = this.baseDensity * 0.2;
    } else if (status.isLowPerformance) {
      // Reduce to 50% density on low performance devices
      this.currentDensity = this.baseDensity * 0.5;
    } else {
      // Full density on high performance devices
      this.currentDensity = this.baseDensity;
    }
  }
  
  /**
   * Adjust snowflake positions for new canvas dimensions
   */
  adjustPositions(width: number, height: number) {
    // Update density based on current performance
    this.updateDensity();
    
    const targetCount = Math.floor(width * height * this.currentDensity);
    const difference = targetCount - this.snowflakes.length;
    
    if (difference > 0) {
      // Add more snowflakes
      this.snowflakes.push(...Array.from({ length: difference }, () => this.createSnowflake(width, height)));
    } else if (difference < 0) {
      // Remove excess snowflakes
      this.snowflakes.splice(0, -difference);
    }
  }
  
  /**
   * Override shouldRender to always show at least some snowflakes
   */
  protected shouldRender(): boolean {
    // Always render snowflakes, but adjust density based on performance
    return true;
  }
  
  /**
   * Animate snowflakes for the next frame
   * Implements abstract method from AnimationComponent
   */
  animate(width: number, height: number) {
    // Handle wind changes
    this.windChangeTimer++;
    if (this.windChangeTimer >= this.windChangeInterval) {
      this.windChangeTimer = 0;
      this.windStrength = (Math.random() * 0.5 - 0.25) * width * 0.00005;
    }
    
    // Move snowflakes (moved from draw to animate method for proper architecture)
    this.snowflakes.forEach(flake => {
      // Update position
      flake.x += flake.sway + this.windStrength;
      flake.y += flake.speed;
      
      // Wrap around screen edges
      if (flake.y > height) {
        flake.y = -flake.size * 2;
        flake.x = Math.random() * width;
      }
      
      if (flake.x > width + flake.size) {
        flake.x = -flake.size;
      } else if (flake.x < -flake.size) {
        flake.x = width + flake.size;
      }
    });
    
    // Update density based on performance periodically
    if (this.windChangeTimer % 60 === 0) {
      this.updateDensity();
      this.adjustPositions(width, height);
    }
  }
  
  /**
   * Draw snowflakes to the canvas
   * Implements abstract method from AnimationComponent
   */
  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const status = this.performanceTracker.getPerformanceStatus();
    
    // Adjust the visual quality based on performance
    // Even on low performance, we still show snowflakes, just fewer of them
    this.snowflakes.forEach(flake => {
      ctx.save();
      ctx.translate(flake.x, flake.y);
      ctx.fillStyle = flake.color;
      ctx.globalAlpha = flake.opacity;
      
      // On very low performance, draw simple circles instead of complex shapes
      if (status.isCriticalPerformance) {
        ctx.beginPath();
        ctx.arc(0, 0, flake.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fill(flake.shape);
      }
      
      ctx.restore();
    });
  }
}