/**
 * Start Position Service Implementation - Modern OptionPicker Nuclear Rebuild
 * Uses Svelte 5 runes for reactive state management without manual subscriptions
 */

import type { PictographData } from '$lib/types/PictographData';
import type { ISequenceService } from '$lib/services/core/ISequenceService';
import type {
	IStartPositionService,
	StartPositionServiceState,
	StartPositionServiceEvents,
	StartPositionServiceConfig,
	ValidationResult
} from './core/IStartPositionService';
import { pictographDataLoader } from '$lib/utils/testing/PictographDataLoader';

const defaultConfig: StartPositionServiceConfig = {
	enableValidation: true,
	autoSync: true,
	enableCaching: true,
	cacheTimeout: 600000, // 10 minutes
	maxPositions: 500
};

/**
 * Modern Start Position Service using Svelte 5 runes
 * Provides reactive state management without manual subscriptions
 */
export class StartPositionService implements IStartPositionService {
	private config: StartPositionServiceConfig;
	private eventListeners = new Map<keyof StartPositionServiceEvents, Set<Function>>();
	private sequenceService: ISequenceService | null = null;
	private cache: { data: PictographData[]; timestamp: number } | null = null;

	// Core reactive state using $state
	private _state = $state<StartPositionServiceState>({
		availablePositions: [],
		selectedPosition: null,
		isLoading: false,
		error: null,
		validationResults: new Map(),
		totalCount: 0,
		lastLoadTime: null
	});

	constructor(config: Partial<StartPositionServiceConfig> = {}) {
		this.config = { ...defaultConfig, ...config };
	}

	// Reactive state (read-only)
	get state(): StartPositionServiceState {
		return this._state;
	}

	// Derived computations using $derived
	get availablePositions(): PictographData[] {
		return this._state.availablePositions;
	}

	get selectedPosition(): PictographData | null {
		return this._state.selectedPosition;
	}

	get isLoading(): boolean {
		return this._state.isLoading;
	}

	get error(): string | null {
		return this._state.error;
	}

	get hasPositions(): boolean {
		return this._state.availablePositions.length > 0;
	}

	get hasSelection(): boolean {
		return this._state.selectedPosition !== null;
	}

	get positionCount(): number {
		return this._state.availablePositions.length;
	}

	// Validation
	get isValidPosition() {
		return (position: PictographData): boolean => {
			const validation = this.validatePosition(position);
			return validation.isValid;
		};
	}

	// Core actions
	async loadPositions(): Promise<void> {
		if (this._state.isLoading) {
			console.warn('StartPositionService: Already loading positions, skipping duplicate request');
			return;
		}

		// Check cache first
		if (this.config.enableCaching && this.isCacheValid()) {
			this.setPositionsData(this.cache!.data);
			return;
		}

		this._state.isLoading = true;
		this._state.error = null;

		try {
			console.log('StartPositionService: Loading start positions');

			// Load all available pictographs as potential start positions
			// Get a sequence of multiple pictographs instead of just one random one
			const allPictographs = await pictographDataLoader.getValidPictographSequence(
				this.config.maxPositions * 2
			);

			// Filter to get unique start positions (based on endPos which becomes startPos for next)
			const uniquePositions = this.getUniqueStartPositions(allPictographs);

			// Apply max positions limit
			const limitedPositions = uniquePositions.slice(0, this.config.maxPositions);

			// Mark as start positions
			const startPositions = limitedPositions.map((pos) => ({
				...pos,
				isStartPosition: true
			}));

			// Cache the results
			if (this.config.enableCaching) {
				this.cache = {
					data: startPositions,
					timestamp: Date.now()
				};
			}

			this.setPositionsData(startPositions);

			// Validate positions if enabled
			if (this.config.enableValidation) {
				this.validateAllPositions();
			}

			this.emit('positions:loaded', { positions: startPositions });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error loading positions';
			this._state.error = errorMessage;
			this.emit('error', { error: errorMessage });
			console.error('StartPositionService: Error loading positions:', error);
		} finally {
			this._state.isLoading = false;
		}
	}

	selectPosition(position: PictographData): void {
		this._state.selectedPosition = position;

		// Sync with SequenceService if configured
		if (this.config.autoSync && this.sequenceService) {
			this.sequenceService.setStartPosition(position);
		}

		this.emit('position:selected', { position });
	}

	clearPosition(): void {
		this._state.selectedPosition = null;

		// Sync with SequenceService if configured
		if (this.config.autoSync && this.sequenceService) {
			this.sequenceService.setStartPosition(null);
		}

		this.emit('position:cleared', {});
	}

	async refreshPositions(): Promise<void> {
		// Clear cache and reload
		this.cache = null;
		await this.loadPositions();
	}

	// Validation
	validatePosition(position: PictographData): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Basic validation
		if (!position.letter) {
			errors.push('Position must have a letter');
		}

		if (!position.endPos) {
			errors.push('Position must have an end position');
		}

		if (!position.startPos) {
			warnings.push('Position missing start position');
		}

		// Motion validation
		if (!position.blueMotionData && !position.redMotionData) {
			warnings.push('Position has no motion data');
		}

		const result: ValidationResult = {
			isValid: errors.length === 0,
			errors,
			warnings
		};

		// Cache validation result
		if (position.letter) {
			this._state.validationResults.set(position.letter.toString(), result);
		}

		return result;
	}

	validateAllPositions(): void {
		this._state.validationResults.clear();

		this._state.availablePositions.forEach((position) => {
			this.validatePosition(position);
		});

		this.emit('validation:completed', { results: this._state.validationResults });
	}

	// Integration
	syncWithSequenceService(sequenceService: ISequenceService): void {
		this.sequenceService = sequenceService;

		// Sync current selection if any
		if (this._state.selectedPosition) {
			sequenceService.setStartPosition(this._state.selectedPosition);
		}

		this.emit('sync:completed', { sequenceService });
	}

	// Utility methods
	getPositionsByType(type: string): PictographData[] {
		return this._state.availablePositions.filter((position) => {
			// This would need to be implemented based on how types are determined
			// For now, filter by motion type
			return (
				position.blueMotionData?.motionType === type || position.redMotionData?.motionType === type
			);
		});
	}

	getRandomPosition(): PictographData | null {
		if (this._state.availablePositions.length === 0) return null;

		const randomIndex = Math.floor(Math.random() * this._state.availablePositions.length);
		return this._state.availablePositions[randomIndex];
	}

	isPositionAvailable(position: PictographData): boolean {
		return this._state.availablePositions.some(
			(available) => available.letter === position.letter && available.endPos === position.endPos
		);
	}

	// Private helper methods
	private setPositionsData(positions: PictographData[]): void {
		this._state.availablePositions = positions;
		this._state.totalCount = positions.length;
		this._state.lastLoadTime = new Date();
	}

	private getUniqueStartPositions(allPictographs: PictographData[]): PictographData[] {
		const uniqueEndPositions = new Set<string>();
		const uniquePositions: PictographData[] = [];

		allPictographs.forEach((pictograph) => {
			if (pictograph.endPos && !uniqueEndPositions.has(pictograph.endPos)) {
				uniqueEndPositions.add(pictograph.endPos);
				uniquePositions.push(pictograph);
			}
		});

		return uniquePositions;
	}

	private isCacheValid(): boolean {
		if (!this.cache) return false;

		const age = Date.now() - this.cache.timestamp;
		return age < this.config.cacheTimeout;
	}

	// Event system
	on<K extends keyof StartPositionServiceEvents>(
		event: K,
		listener: (data: StartPositionServiceEvents[K]) => void
	): () => void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}

		this.eventListeners.get(event)!.add(listener);

		return () => this.eventListeners.get(event)?.delete(listener);
	}

	private emit<K extends keyof StartPositionServiceEvents>(
		event: K,
		data: StartPositionServiceEvents[K]
	): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => listener(data));
		}
	}
}
