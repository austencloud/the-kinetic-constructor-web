import type { Dimensions, QualityLevel } from '../types/types';
import { PerformanceTracker } from './PerformanceTracker';

/**
 * Abstract base class for all animation components
 * Provides common functionality and a consistent interface
 */
export abstract class AnimationComponent {
  protected performanceTracker: PerformanceTracker;
  protected initialized: boolean = false;
  protected quality: QualityLevel = 'medium';
  
  constructor() {
    this.performanceTracker = PerformanceTracker.getInstance();
  }
  
  /**
   * Initialize the component with dimensions and quality
   * @param dimensions Canvas dimensions
   * @param quality Animation quality
   */
  abstract initialize(dimensions: Dimensions, quality: QualityLevel): void;
  
  /**
   * Update component state for the next frame
   * @param dimensions Current canvas dimensions
   */
  abstract update(dimensions: Dimensions): void;
  
  /**
   * Draw the component to the canvas
   * @param ctx Canvas rendering context
   * @param dimensions Current canvas dimensions
   */
  abstract draw(ctx: CanvasRenderingContext2D, dimensions: Dimensions): void;
  
  /**
   * Clean up any resources used by the component
   */
  abstract cleanup(): void;
  
  /**
   * Update quality settings
   * @param quality The new quality level
   */
  setQuality(quality: QualityLevel): void {
    this.quality = quality;
  }
  
  /**
   * Check if this component should render based on performance metrics
   * @returns Boolean indicating whether to render
   */
  protected shouldRender(): boolean {
    const status = this.performanceTracker.getPerformanceStatus();
    return status.fps > 40; // Only render if performance is good
  }
  
  /**
   * Helper method to get a random integer between min and max (inclusive)
   */
  protected randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Helper method to get a random float between min and max
   */
  protected randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}