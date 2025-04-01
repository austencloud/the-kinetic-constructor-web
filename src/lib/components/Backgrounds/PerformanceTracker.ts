// Performance Tracking Utility
export class PerformanceTracker {
    private static instance: PerformanceTracker | null = null;
    
    private lastRenderTime = 0;
    private frameCount = 0;
    private fps = 0;
    private performanceWarnings: string[] = [];
  
    private constructor() {}
  
    static getInstance(): PerformanceTracker {
      if (!this.instance) {
        this.instance = new PerformanceTracker();
      }
      return this.instance;
    }
  
    update() {
      this.frameCount++;
      const now = performance.now();
      
      if (now >= this.lastRenderTime + 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastRenderTime = now;
  
        if (this.fps < 50) {
          this.performanceWarnings.push(`Low FPS detected: ${this.fps}`);
        }
      }
    }
  
    getPerformanceStatus() {
      return {
        fps: this.fps,
        warnings: this.performanceWarnings
      };
    }
  }
  
  // Performance Management Base Class
  export abstract class PerformanceManager {
    protected performanceTracker: PerformanceTracker;
    
    constructor() {
      this.performanceTracker = PerformanceTracker.getInstance();
    }
  
    protected shouldRender(): boolean {
      const status = this.performanceTracker.getPerformanceStatus();
      return status.fps > 40; // Only render if performance is good
    }
  }