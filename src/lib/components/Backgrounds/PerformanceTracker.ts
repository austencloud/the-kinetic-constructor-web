// src/lib/components/Backgrounds/PerformanceTracker.ts
// Enhanced version of the existing PerformanceTracker

/**
 * Singleton class for tracking rendering performance across all animation components
 */
export class PerformanceTracker {
  private static instance: PerformanceTracker | null = null;
  
  private lastRenderTime = 0;
  private frameCount = 0;
  private fps = 0;
  private performanceWarnings: string[] = [];
  private lowPerformanceThreshold = 40; // FPS threshold for performance warning
  private criticalPerformanceThreshold = 20; // FPS threshold for critical performance warning

  private constructor() {}

  /**
   * Get the singleton instance of the PerformanceTracker
   */
  static getInstance(): PerformanceTracker {
    if (!this.instance) {
      this.instance = new PerformanceTracker();
    }
    return this.instance;
  }

  /**
   * Update performance metrics - call this once per animation frame
   */
  update() {
    this.frameCount++;
    const now = performance.now();
    
    if (now >= this.lastRenderTime + 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastRenderTime = now;

      // Add performance warnings based on thresholds
      if (this.fps < this.criticalPerformanceThreshold) {
        this.performanceWarnings.push(`Critical performance: ${this.fps} FPS`);
      } else if (this.fps < this.lowPerformanceThreshold) {
        this.performanceWarnings.push(`Low FPS detected: ${this.fps}`);
      }
      
      // Limit the warnings array to prevent memory issues
      if (this.performanceWarnings.length > 20) {
        this.performanceWarnings = this.performanceWarnings.slice(-20);
      }
    }
  }

  /**
   * Get the current performance status
   */
  getPerformanceStatus() {
    return {
      fps: this.fps,
      warnings: this.performanceWarnings,
      isLowPerformance: this.fps < this.lowPerformanceThreshold,
      isCriticalPerformance: this.fps < this.criticalPerformanceThreshold
    };
  }
  
  /**
   * Set the low performance threshold
   */
  setLowPerformanceThreshold(threshold: number) {
    this.lowPerformanceThreshold = threshold;
  }
  
  /**
   * Set the critical performance threshold
   */
  setCriticalPerformanceThreshold(threshold: number) {
    this.criticalPerformanceThreshold = threshold;
  }
  
  /**
   * Reset performance tracking
   */
  reset() {
    this.frameCount = 0;
    this.fps = 0;
    this.lastRenderTime = performance.now();
    this.performanceWarnings = [];
  }
}