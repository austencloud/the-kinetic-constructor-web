import { AnimationConfig } from '../AnimationConfig';
import { drawBackgroundGradient } from '../snowfall/utils/backgroundUtils';
import type { BackgroundSystem, Dimensions, GradientStop, QualityLevel } from '../types/types';

/**
 * Implementation of a simple gradient background system
 */
export class GradientBackgroundSystem implements BackgroundSystem {
  private gradientStops: GradientStop[] = [];
  
  constructor() {
    // Use default gradient or customize
    this.gradientStops = [...AnimationConfig.background.gradientStops];
  }
  
  /**
   * Initialize the gradient background
   * @param dimensions Current canvas dimensions
   * @param quality Animation quality (not used for gradient)
   */
  public initialize(dimensions: Dimensions, quality: QualityLevel): void {
    // Nothing to initialize for a static gradient
  }
  
  /**
   * Update the gradient background state (no-op for static gradient)
   * @param dimensions Current canvas dimensions
   */
  public update(dimensions: Dimensions): void {
    // No updates needed for static gradient
  }
  
  /**
   * Draw the gradient background to the canvas
   * @param ctx Canvas rendering context
   * @param dimensions Current canvas dimensions
   */
  public draw(ctx: CanvasRenderingContext2D, dimensions: Dimensions): void {
    // Draw gradient background
    drawBackgroundGradient(ctx, dimensions, this.gradientStops);
  }
  
  /**
   * Update quality settings (no-op for gradient)
   * @param quality The new quality level
   */
  public setQuality(quality: QualityLevel): void {
    // Quality doesn't affect static gradient
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Nothing to clean up
  }
  
  /**
   * Set custom gradient colors
   * @param gradientStops New gradient stops
   */
  public setGradient(gradientStops: GradientStop[]): void {
    this.gradientStops = [...gradientStops];
  }
}