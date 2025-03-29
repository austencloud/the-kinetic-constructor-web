import type { PictographData } from '$lib/types/PictographData';
import type { Writable } from 'svelte/store';
import { MAX_RETRIES, type RenderStage } from '../../constants/trackingConstants';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import { Logger } from '$lib/utils/Logger';

type LifecycleEventHandler = (eventData?: any) => void;

export class PictographLifecycleService {
	private initializationStarted = false;
	private gridDataLoaded = false;
	private retryCount = 0;
	private safetyTimer: number | null = null;
	private logger: Logger;
	private readonly SAFETY_TIMEOUT = 150;

	constructor(
		private pictographDataStore: Writable<PictographData>,
		private onStageChange: (newStage: RenderStage) => void,
		private onLoadedEvent: LifecycleEventHandler,
		private onErrorEvent: LifecycleEventHandler,
	) {
		this.logger = new Logger('LifecycleService');
	}

	public startInitialization(): void {
		if (this.initializationStarted) return;
		this.initializationStarted = true;
		this.logger.debug('Starting initialization process');
		this.onStageChange('initializing');
		this.setupSafetyTimeout();
		this.onStageChange('loading');
	}

	private setupSafetyTimeout(): void {
		this.clearSafetyTimer();
		this.safetyTimer = window.setTimeout(() => {
			this.handleSafetyTimeout();
		}, this.SAFETY_TIMEOUT);
	}

	public handleGridDataReady(
		data: GridData,
		initCallback: () => Promise<void>
	): void {
		if (this.gridDataLoaded) {
			this.logger.warn('Grid data already processed');
			return;
		}
		this.logger.debug('Grid data ready');
		try {
			this.validateGridData(data);
			this.pictographDataStore.update((existingData) => ({
				...existingData,
				gridData: data
			}));
			this.gridDataLoaded = true;
			this.onStageChange('grid_ready');
			this.runInitialization(initCallback);
		} catch (error) {
			this.handleGridDataError(error);
		}
	}

	private validateGridData(data: GridData): void {
		if (!data || !data.allHandPointsNormal) {
			throw new Error('Received invalid GridData structure');
		}
	}

	private runInitialization(initCallback: () => Promise<void>): void {
		initCallback().catch(error => {
			this.handleInitializationError(error, initCallback);
		});
	}

	private handleGridDataError(error: unknown): void {
		this.logger.error('Error handling grid data', error);
		this.onErrorEvent({ 
			source: 'grid_processing', 
			error,
			message: error instanceof Error ? error.message : 'Grid data processing failed'
		});
		this.clearSafetyTimer();
		this.onStageChange('complete');
		this.onLoadedEvent({ error: true, message: 'Grid data processing failed' });
	}

	public handleInitializationError(
		error: unknown, 
		initCallback: () => Promise<void>
	): void {
		this.logger.error(`Initialization error (Attempt ${this.retryCount + 1})`, error);
		if (this.retryCount < MAX_RETRIES) {
			this.retryCount++;
			this.logger.info(`Retrying initialization (attempt ${this.retryCount} of ${MAX_RETRIES})`);
			const backoffDelay = Math.pow(2, this.retryCount) * 250;
			window.setTimeout(() => {
				this.runInitialization(initCallback);
			}, backoffDelay);
		} else {
			this.handleMaxRetriesReached(error);
		}
	}

	private handleMaxRetriesReached(error: unknown): void {
		this.logger.error('Maximum initialization retries reached. Failing.');
		this.clearSafetyTimer();
		this.onStageChange('complete');
		this.onLoadedEvent({ 
			error: true, 
			message: 'Initialization failed after retries' 
		});
		this.onErrorEvent({ 
			source: 'initialization', 
			message: error instanceof Error ? error.message : 'Unknown initialization error after retries' 
		});
	}

	public handleIncompleteData(): void {
		this.logger.warn('Initializer reported incomplete data');
		this.clearSafetyTimer();
		this.onStageChange('complete');
		this.onLoadedEvent({ incompleteData: true });
	}

	public handleInitializationSuccess(): void {
		this.logger.debug('Initializer reported successful completion');
		this.clearSafetyTimer();
	}

	private handleSafetyTimeout(): void {
		this.logger.warn('Safety timeout triggered! Forcing rendering completion.');
		this.safetyTimer = null;
		this.onStageChange('complete');
		this.onLoadedEvent({ timedOut: true });
		this.onErrorEvent({ 
			source: 'timeout', 
			message: 'Initialization timed out'
		});
	}

	public cleanup(): void {
		this.logger.debug('Cleaning up');
		this.clearSafetyTimer();
	}

	private clearSafetyTimer(): void {
		if (this.safetyTimer !== null) {
			window.clearTimeout(this.safetyTimer);
			this.safetyTimer = null;
		}
	}
}
