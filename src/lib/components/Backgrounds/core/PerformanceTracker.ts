/**
 * Singleton class to track performance metrics across all animation components
 */
export class PerformanceTracker {
    private static instance: PerformanceTracker;
    private fps: number = 60;
    private frameCount: number = 0;
    private lastTime: number = 0;
    private particleCount: number = 0;
    private warnings: string[] = [];
    
    // Private constructor for singleton pattern
    private constructor() {
      this.lastTime = performance.now();
    }
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): PerformanceTracker {
      if (!PerformanceTracker.instance) {
        PerformanceTracker.instance = new PerformanceTracker();
      }
      return PerformanceTracker.instance;
    }
    
    /**
     * Update performance metrics - should be called once per frame
     */
    public update(): void {
      const now = performance.now();
      this.frameCount++;
      
      if (now >= this.lastTime + 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = now;
        
        // Add warnings if performance is poor
        if (this.fps < 30) {
          this.warnings.push(`Low FPS detected: ${this.fps}`);
          // Limit warnings array size
          if (this.warnings.length > 5) this.warnings.shift();
        } else {
          // Clear warnings if performance improves
          if (this.warnings.length > 0) {
            this.warnings = [];
          }
        }
      }
    }
    
    /**
     * Get current performance status
     */
    public getPerformanceStatus(): {
      fps: number;
      particleCount: number;
      warnings: string[];
    } {
      return {
        fps: this.fps,
        particleCount: this.particleCount,
        warnings: this.warnings
      };
    }
    
    /**
     * Set the current particle count
     */
    public setParticleCount(count: number): void {
      this.particleCount = count;
    }
    
    /**
     * Reset performance metrics
     */
    public reset(): void {
      this.fps = 60;
      this.frameCount = 0;
      this.lastTime = performance.now();
      this.particleCount = 0;
      this.warnings = [];
    }
  }