// src/lib/components/Pictograph/services/PictographLifecycleService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '../../objects/Grid/GridData';
import type { Writable } from 'svelte/store';
import { get } from 'svelte/store';
import type { PictographInitializer } from '../PictographInitializer';
import type { PictographManagers } from '../PictographManagers';
import type { RenderStage } from '../constants/trackingConstants';

type LifecycleEventHandler = (eventData?: any) => void;

/**
 * Handles the lifecycle management for Pictograph components
 */
export class PictographLifecycleService {
  private initializationComplete = false;
  private gridDataLoaded = false;
  private retryCount = 0;
  private safetyTimer: number | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly SAFETY_TIMEOUT = 500;

  constructor(
    private pictographDataStore: Writable<PictographData>,
    private onStageChange: (newStage: RenderStage) => void,
    private onLoadedEvent: LifecycleEventHandler,
    private onErrorEvent: LifecycleEventHandler
  ) {}

  /**
   * Start the initialization process
   * @param currentStage - Current rendering stage
   * @param initializer - Reference to initializer (can be null during startup)
   * @param initCallback - Function to call to initialize components
   */
  public startInitialization(
    currentStage: RenderStage,
    initializer: PictographInitializer | null,
    initCallback: () => Promise<void>
  ): void {
    // Set up safety timeout (initializer might be null at this point)
    this.safetyTimer = setTimeout(() => {
      this.handleSafetyTimeout(initializer);
    }, this.SAFETY_TIMEOUT);

    // Begin initialization if needed
    if (!this.initializationComplete) {
      this.onStageChange('loading');
    }
  }

  /**
   * Handle grid data being ready
   */
  public handleGridDataReady(
    data: GridData, 
    debug: boolean,
    initCallback: () => void
  ): void {
    try {
      // Update store with grid data
      this.pictographDataStore.update((existingData) => ({
        ...existingData,
        gridData: data
      }));

      // Log sample points if in debug mode
      if (debug) {
        const samplePoints = Object.entries(data.allHandPointsNormal).slice(0, 3);
        console.log('Sample grid points:', samplePoints);
      }

      this.gridDataLoaded = true;
      this.onStageChange('grid_ready');
      
      // Trigger initialization
      initCallback();
    } catch (error) {
      console.error('Error handling grid data:', error);
      this.onErrorEvent({ source: 'grid', error });
    }
  }

  /**
   * Handle initialization error with retry logic
   */
  public handleInitializationError(error: any, initCallback: () => void): void {
    console.error('Initialization error:', error);
    
    if (this.retryCount < this.MAX_RETRIES) {
      this.retryCount++;
      console.log(`Retrying initialization (attempt ${this.retryCount} of ${this.MAX_RETRIES})...`);
      setTimeout(initCallback, 500);
    } else {
      console.error('Maximum retries reached, attempting to show fallback view');
      this.onStageChange('complete');
      this.onLoadedEvent({ error: true });
      this.onErrorEvent({ message: (error as any)?.message || 'Unknown error' });
      this.clearSafetyTimer();
    }
  }

  /**
   * Emergency timeout handler to ensure rendering completes
   */
  private handleSafetyTimeout(initializer: PictographInitializer | null): void {
    console.warn('Safety timeout triggered, forcing rendering completion');
    
    // Force initializer completion if possible
    if (initializer) {
      try {
        // @ts-ignore - Accessing private method for emergency
        if (initializer.resolveReady && typeof initializer.resolveReady === 'function') {
          initializer.resolveReady();
        }
      } catch (e) {
        console.error('Could not force initializer completion:', e);
      }
    }
    
    // Force completion
    this.initializationComplete = true;
    this.onStageChange('complete');
    this.onLoadedEvent({ timedOut: true });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.clearSafetyTimer();
  }

  private clearSafetyTimer(): void {
    if (this.safetyTimer !== null) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
  }
}