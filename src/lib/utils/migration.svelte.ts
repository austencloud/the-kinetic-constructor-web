/**
 * Migration Utilities for Gradual Architecture Transition
 * Provides feature flags and component wrappers for safe migration
 */

import { browser } from '$app/environment';

// Feature flags for gradual rollout
export const migrationFlags = $state({
  useModernSequenceService: false,
  useModernBeatGrid: false,
  useModernWorkbench: false,
  useVirtualScrolling: false,
  useServiceInjection: false,
  enablePerformanceMonitoring: true,
  enableReactiveLoopDetection: true
});

// Migration configuration
export interface MigrationConfig {
  enabledFlags: (keyof typeof migrationFlags)[];
  rollbackOnError: boolean;
  performanceThreshold: number; // ms
  memoryThreshold: number; // MB
}

export const defaultMigrationConfig: MigrationConfig = {
  enabledFlags: ['enablePerformanceMonitoring', 'enableReactiveLoopDetection'],
  rollbackOnError: true,
  performanceThreshold: 100,
  memoryThreshold: 50
};

/**
 * Migration manager for coordinating the transition
 */
export class MigrationManager {
  private config: MigrationConfig;
  private rollbackPoints = new Map<string, any>();
  private performanceMetrics = $state({
    renderTime: 0,
    memoryUsage: 0,
    errorCount: 0,
    lastUpdate: Date.now()
  });

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = { ...defaultMigrationConfig, ...config };
    this.initializeFlags();
    this.setupMonitoring();
  }

  private initializeFlags() {
    // Load saved flags from localStorage
    if (browser) {
      try {
        const saved = localStorage.getItem('migration_flags');
        if (saved) {
          const savedFlags = JSON.parse(saved);
          Object.assign(migrationFlags, savedFlags);
        }
      } catch (error) {
        console.error('Failed to load migration flags:', error);
      }
    }

    // Apply config flags
    this.config.enabledFlags.forEach(flag => {
      migrationFlags[flag] = true;
    });
  }

  private setupMonitoring() {
    if (!migrationFlags.enablePerformanceMonitoring) return;

    $effect(() => {
      // Monitor performance periodically
      const interval = setInterval(() => {
        this.updatePerformanceMetrics();
        this.checkThresholds();
      }, 5000);

      return () => clearInterval(interval);
    });
  }

  private updatePerformanceMetrics() {
    if (!browser) return;

    this.performanceMetrics.lastUpdate = Date.now();

    if ('memory' in performance) {
      this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
  }

  private checkThresholds() {
    if (this.performanceMetrics.memoryUsage > this.config.memoryThreshold) {
      console.warn(`Memory usage exceeded threshold: ${this.performanceMetrics.memoryUsage.toFixed(2)}MB`);
      
      if (this.config.rollbackOnError) {
        this.rollbackToSafeState();
      }
    }
  }

  /**
   * Enable a specific migration flag
   */
  enableFlag(flag: keyof typeof migrationFlags) {
    this.createRollbackPoint(flag, migrationFlags[flag]);
    migrationFlags[flag] = true;
    this.saveFlags();
    console.log(`✅ Migration flag enabled: ${flag}`);
  }

  /**
   * Disable a specific migration flag
   */
  disableFlag(flag: keyof typeof migrationFlags) {
    this.createRollbackPoint(flag, migrationFlags[flag]);
    migrationFlags[flag] = false;
    this.saveFlags();
    console.log(`❌ Migration flag disabled: ${flag}`);
  }

  /**
   * Create a rollback point for safe migration
   */
  createRollbackPoint(key: string, state: any) {
    this.rollbackPoints.set(key, structuredClone(state));
  }

  /**
   * Rollback to a previous state
   */
  rollback(key: string): boolean {
    const rollbackState = this.rollbackPoints.get(key);
    if (rollbackState !== undefined) {
      if (key in migrationFlags) {
        (migrationFlags as any)[key] = rollbackState;
        this.saveFlags();
        console.log(`🔄 Rolled back migration flag: ${key}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Rollback to a safe state when errors occur
   */
  rollbackToSafeState() {
    console.warn('🚨 Rolling back to safe state due to performance issues');
    
    // Disable performance-intensive flags
    migrationFlags.useVirtualScrolling = false;
    migrationFlags.useModernBeatGrid = false;
    
    this.saveFlags();
  }

  /**
   * Save current flags to localStorage
   */
  private saveFlags() {
    if (browser) {
      try {
        localStorage.setItem('migration_flags', JSON.stringify(migrationFlags));
      } catch (error) {
        console.error('Failed to save migration flags:', error);
      }
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  /**
   * Reset all flags to default state
   */
  resetFlags() {
    Object.keys(migrationFlags).forEach(key => {
      (migrationFlags as any)[key] = false;
    });
    
    this.config.enabledFlags.forEach(flag => {
      migrationFlags[flag] = true;
    });
    
    this.saveFlags();
    console.log('🔄 Migration flags reset to default');
  }
}

/**
 * Create a migration wrapper for components
 */
export function createMigrationWrapper<T>(
  legacyComponent: any,
  modernComponent: any,
  flagKey: keyof typeof migrationFlags
) {
  return $derived(migrationFlags[flagKey] ? modernComponent : legacyComponent);
}

/**
 * Hook for using migration manager in components
 */
export function useMigrationManager(config?: Partial<MigrationConfig>) {
  return new MigrationManager(config);
}

/**
 * Reactive loop detection utility
 */
export class ReactiveLoopDetector {
  private effectCounts = new Map<string, number>();
  private isActive = $state(migrationFlags.enableReactiveLoopDetection);

  constructor() {
    this.setupDetection();
  }

  private setupDetection() {
    if (!browser || !this.isActive) return;

    // Monkey patch $effect to detect loops
    const originalEffect = globalThis.$effect;
    if (originalEffect) {
      globalThis.$effect = (fn: Function) => {
        const effectId = Math.random().toString(36).substr(2, 9);
        this.effectCounts.set(effectId, 0);

        return originalEffect(() => {
          const count = this.effectCounts.get(effectId)! + 1;
          this.effectCounts.set(effectId, count);

          if (count > 5) {
            console.error(`🚨 REACTIVE LOOP DETECTED: Effect ${effectId} executed ${count} times`);
            
            // Emit custom event for monitoring
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('reactive-loop-detected', {
                detail: { effectId, count }
              }));
            }
          }

          return fn();
        });
      };
    }
  }

  getEffectCounts() {
    return new Map(this.effectCounts);
  }

  reset() {
    this.effectCounts.clear();
  }
}

/**
 * Performance measurement utility
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  threshold: number = 50
): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (duration > threshold) {
    console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
  } else if (import.meta.env.DEV) {
    console.log(`✅ ${name}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Memory usage tracker
 */
export function trackMemoryUsage(label: string) {
  if (!browser || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  const usedMB = memory.usedJSHeapSize / 1024 / 1024;
  const totalMB = memory.totalJSHeapSize / 1024 / 1024;

  console.log(`📊 Memory (${label}): ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`);

  if (usedMB > 100) {
    console.warn(`⚠️ High memory usage detected: ${usedMB.toFixed(2)}MB`);
  }
}

// Global migration manager instance
export const migrationManager = new MigrationManager();

// Global reactive loop detector
export const reactiveLoopDetector = new ReactiveLoopDetector();

// Export flags for easy access
export { migrationFlags };
