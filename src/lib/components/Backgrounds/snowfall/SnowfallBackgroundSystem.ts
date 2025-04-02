import { AnimationConfig } from '../AnimationConfig';
import { createSnowflakeSystem } from './systems/SnowflakeSystem';
import { createShootingStarSystem } from './systems/ShootingStarSystem';
import type { BackgroundSystem, Dimensions, QualityLevel, ShootingStarState, Snowflake } from '../types/types';
import { drawBackgroundGradient } from './utils/backgroundUtils';

/**
 * Implementation of a snowfall background system
 */
export class SnowfallBackgroundSystem implements BackgroundSystem {
  private snowflakeSystem = createSnowflakeSystem();
  private shootingStarSystem = createShootingStarSystem();
  
  private snowflakes: Snowflake[] = [];
  private shootingStarState: ShootingStarState;
  
  private quality: QualityLevel = 'medium';
  private isDecember: boolean = false;
  
  constructor() {
    // Initialize empty shooting star state
    this.shootingStarState = this.shootingStarSystem.initialState;
    
    // Check if December for seasonal features
    this.isDecember = new Date().getMonth() === 11;
  }
  
  /**
   * Initialize the snowfall background
   * @param dimensions Current canvas dimensions
   * @param quality Animation quality
   */
  public initialize(dimensions: Dimensions, quality: QualityLevel): void {
    this.quality = quality;
    
    // Initialize snowflake system
    this.snowflakes = this.snowflakeSystem.initialize(dimensions, quality);
    
    // Reset shooting star state
    this.shootingStarState = this.shootingStarSystem.initialState;
  }
  
  /**
   * Update the snowfall background state
   * @param dimensions Current canvas dimensions
   */
  public update(dimensions: Dimensions): void {
    // Update snowflakes
    this.snowflakes = this.snowflakeSystem.update(this.snowflakes, dimensions);
    
    // Only update shooting stars in high quality mode
    if (this.quality === 'high') {
      this.shootingStarState = this.shootingStarSystem.update(this.shootingStarState, dimensions);
    }
  }
  
  /**
   * Draw the snowfall background to the canvas
   * @param ctx Canvas rendering context
   * @param dimensions Current canvas dimensions
   */
  public draw(ctx: CanvasRenderingContext2D, dimensions: Dimensions): void {
    // Draw gradient background
    drawBackgroundGradient(ctx, dimensions, AnimationConfig.background.gradientStops);
    
    // Draw snowflakes
    this.snowflakeSystem.draw(this.snowflakes, ctx, dimensions);
    
    // Only draw shooting stars in high quality mode
    if (this.quality === 'high') {
      this.shootingStarSystem.draw(this.shootingStarState, ctx);
    }
  }
  
  /**
   * Update quality settings
   * @param quality The new quality level
   */
  public setQuality(quality: QualityLevel): void {
    this.quality = quality;
  }
  
  /**
   * Handle resize event
   * @param oldDimensions Previous dimensions
   * @param newDimensions New dimensions
   */
  public handleResize(oldDimensions: Dimensions, newDimensions: Dimensions): void {
    // Adjust snowflakes for new dimensions
    this.snowflakes = this.snowflakeSystem.adjustToResize(
      this.snowflakes,
      oldDimensions,
      newDimensions,
      this.quality
    );
    
    // Reset shooting star state
    this.shootingStarState = this.shootingStarSystem.initialState;
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Nothing to clean up for now
  }
}