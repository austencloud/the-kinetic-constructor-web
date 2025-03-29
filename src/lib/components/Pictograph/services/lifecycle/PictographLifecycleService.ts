// src/lib/components/Pictograph/services/PictographLifecycleService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { Writable } from 'svelte/store';
import { DEFAULT_SAFETY_TIMEOUT, MAX_RETRIES, type RenderStage } from '../../constants/trackingConstants';
import type { GridData } from '$lib/components/objects/Grid/GridData';


type LifecycleEventHandler = (eventData?: any) => void;

/**
 * Manages the overall lifecycle and initialization flow of the Pictograph component.
 * Handles:
 * - Initial setup and triggering initialization.
 * - Integrating grid data readiness.
 * - Managing initialization retries on errors.
 * - Implementing a safety timeout to prevent indefinite loading.
 * - Coordinating stage transitions (`onStageChange`).
 * - Emitting loaded (`onLoadedEvent`) and error (`onErrorEvent`) events.
 */
export class PictographLifecycleService {
	private initializationStarted = false;
	private gridDataLoaded = false;
	private retryCount = 0;
	private safetyTimer: ReturnType<typeof setTimeout> | null = null; // Use correct Timer type
    private debugMode: boolean = true; // Enable logging

	constructor(
		private pictographDataStore: Writable<PictographData>,
		private onStageChange: (newStage: RenderStage) => void,
		private onLoadedEvent: LifecycleEventHandler,
		private onErrorEvent: LifecycleEventHandler,
        // Dependencies injected here
        private debug: boolean = false // Pass debug flag
	) {}

	/**
	 * Starts the initialization process. Should be called from `onMount`.
	 * Sets up a safety timeout and triggers the initial stage change.
	 * The actual component initialization logic is passed via `initCallback`.
	 *
	 * @param initCallback - Async function that performs the core initialization (e.g., calling `initializer.initialize()`).
	 */
	public startInitialization(
		initCallback: () => Promise<void>
	): void {
        if (this.initializationStarted) return; // Prevent multiple starts
        this.initializationStarted = true;

		if(this.debug) console.log('🚀 LifecycleService: Starting Initialization Process...');

		// Set initial stage
		this.onStageChange('initializing');

		// Setup safety timeout: If initialization takes too long, force completion.
		this.clearSafetyTimer(); // Clear any previous timer
		this.safetyTimer = setTimeout(() => {
			this.handleSafetyTimeout();
		}, DEFAULT_SAFETY_TIMEOUT);

		// Immediately transition to loading as async operations will start
		this.onStageChange('loading');

        // Note: We don't call initCallback directly here.
        // It should be called *after* grid data is ready.
	}

	/**
	 * Handles the event when the Grid component provides its data.
	 * Updates the pictograph store, changes stage, and triggers the main initialization callback.
	 *
	 * @param data - The GridData provided by the Grid component.
	 * @param initCallback - The async function to run core initialization logic.
	 */
	public handleGridDataReady(
		data: GridData,
		initCallback: () => Promise<void>
	): void {
        if (this.gridDataLoaded) {
            if(this.debug) console.log('⚠️ LifecycleService: Grid data already processed.');
            return; // Avoid processing grid data multiple times
        }

        if(this.debug) console.log('✅ LifecycleService: Grid data ready.');

		try {
			// Validate basic grid data structure
            if (!data || !data.allHandPointsNormal) {
                throw new Error('Received invalid GridData structure.');
            }

			// Update the central store with grid data
			this.pictographDataStore.update((existingData) => ({
				...existingData,
				gridData: data
			}));

			if (this.debug) {
				const pointCount = Object.keys(data.allHandPointsNormal).length;
				console.log(`📊 LifecycleService: Grid data stored. ${pointCount} hand points found.`);
			}

			this.gridDataLoaded = true;
			this.onStageChange('grid_ready'); // Signal grid is ready

			// Now that grid is ready, trigger the main initialization callback
            // This allows Initializer/Managers to access grid data safely
            initCallback().catch(error => {
                // Handle errors from the initCallback itself
                this.handleInitializationError(error, initCallback);
            });

		} catch (error) {
			console.error('❌ LifecycleService: Error handling grid data:', error);
			this.onErrorEvent({ source: 'grid_processing', error });
            // Consider how to recover or signal failure
            this.clearSafetyTimer(); // Stop safety timer on critical error
            this.onStageChange('complete'); // Move to complete to show something?
            this.onLoadedEvent({ error: true, message: 'Grid data processing failed' });
		}
	}

	/**
	 * Handles errors occurring during the main initialization callback (`initCallback`).
	 * Implements a retry mechanism.
	 *
	 * @param error - The error caught during initialization.
	 * @param initCallback - The initialization function to retry.
	 */
	public handleInitializationError(error: any, initCallback: () => Promise<void>): void {
		console.error(`❌ LifecycleService: Initialization error (Attempt ${this.retryCount + 1}):`, error);

		if (this.retryCount < MAX_RETRIES) {
			this.retryCount++;
			console.log(`⏳ LifecycleService: Retrying initialization (attempt ${this.retryCount + 1} of ${MAX_RETRIES + 1})...`);
			// Retry after a short delay
			setTimeout(() => {
                initCallback().catch(retryError => {
                    this.handleInitializationError(retryError, initCallback); // Recursive call for retry errors
                });
            }, 500 * this.retryCount); // Exponential backoff (simple)
		} else {
			console.error('❌ LifecycleService: Maximum initialization retries reached. Failing.');
			this.clearSafetyTimer(); // Stop safety timer
			this.onStageChange('complete'); // Force complete stage
			this.onLoadedEvent({ error: true, message: 'Initialization failed after retries' }); // Signal failure
			this.onErrorEvent({ source: 'initialization', message: (error as Error)?.message || 'Unknown initialization error after retries' });
		}
	}

    /**
     * Called when the main `PictographInitializer` signals it encountered incomplete
     * input data and cannot perform a full initialization.
     */
    public handleIncompleteData(): void {
        if(this.debug) console.log('⚠️ LifecycleService: Initializer reported incomplete data.');
        this.clearSafetyTimer(); // Initialization finished (partially)
        // Stage might already be 'grid_ready' or 'loading'. Move to 'complete'.
        this.onStageChange('complete');
        // Dispatch loaded event, indicating partial success due to data issues
        this.onLoadedEvent({ incompleteData: true });
    }

    /**
     * Called when the main `PictographInitializer` signals successful completion.
     */
    public handleInitializationSuccess(): void {
         if(this.debug) console.log('✅ LifecycleService: Initializer reported successful completion.');
         this.clearSafetyTimer(); // Initialization completed successfully
         // Stage should naturally progress via ComponentStatusService after this
         // No direct stage change needed here unless confirming success state
    }

	/**
	 * Emergency handler triggered by the safety timeout. Forces the component
	 * into a 'complete' state to prevent it from being stuck loading indefinitely.
	 */
	private handleSafetyTimeout(): void {
		console.warn('⚠️ LifecycleService: Safety timeout triggered! Forcing rendering completion.');
        this.safetyTimer = null; // Mark timer as inactive

        // Check current state - maybe it completed just before timeout?
        // This requires access to the current stage, which isn't stored here directly.
        // Assume it's stuck if timeout fires.

		// Force stage to complete
		this.onStageChange('complete');
		// Emit loaded event, indicating potential issue
		this.onLoadedEvent({ timedOut: true });
        this.onErrorEvent({ source: 'timeout', message: 'Initialization timed out.' });
	}

	/**
	 * Cleans up resources, specifically the safety timer. Call from `onDestroy`.
	 */
	public cleanup(): void {
        if(this.debug) console.log('🧹 LifecycleService: Cleaning up...');
		this.clearSafetyTimer();
	}

	/** Safely clears the safety timeout timer. */
	private clearSafetyTimer(): void {
		if (this.safetyTimer !== null) {
			clearTimeout(this.safetyTimer);
			this.safetyTimer = null;
             if(this.debug) console.log('⏱️ LifecycleService: Safety timer cleared.');
		}
	}
}