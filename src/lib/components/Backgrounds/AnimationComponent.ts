// src/lib/components/Backgrounds/AnimationComponent.ts
import { PerformanceTracker } from './PerformanceTracker';

/**
 * Abstract base class for all animation components
 * Provides common functionality and a consistent interface
 */
export abstract class AnimationComponent {
  protected performanceTracker: PerformanceTracker;
  protected initialized: boolean = false;
  
  constructor() {
    this.performanceTracker = PerformanceTracker.getInstance();
  }
  
  /**
   * Initialize the component with dimensions
   * @param width Canvas width
   * @param height Canvas height
   */
  abstract initialize(width: number, height: number): void;
  
  /**
   * Update component state for the next frame
   * @param width Current canvas width
   * @param height Current canvas height
   */
  abstract animate(width: number, height: number): void;
  
  /**
   * Draw the component to the canvas
   * @param ctx Canvas rendering context
   * @param width Current canvas width
   * @param height Current canvas height
   */
  abstract draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
  
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