/**
 * Option Service Implementation - Modern OptionPicker Nuclear Rebuild
 * Uses Svelte 5 runes for reactive state management without manual subscriptions
 */

import type { PictographData } from '$lib/types/PictographData';
import type {
	IOptionService,
	OptionServiceState,
	OptionServiceEvents,
	OptionServiceConfig,
	FilterCriteria,
	SortCriteria
} from './core/IOptionService';
import { getNextOptions, determineGroupKey, getSorter } from '../../services/OptionsService';

const defaultConfig: OptionServiceConfig = {
	maxOptions: 1000,
	enableCaching: true,
	cacheTimeout: 300000, // 5 minutes
	autoFilter: true,
	defaultSort: { field: 'letter', direction: 'asc' }
};

/**
 * Modern Option Service using Svelte 5 runes
 * Provides reactive state management without manual subscriptions
 */
export class OptionService implements IOptionService {
	private config: OptionServiceConfig;
	private eventListeners = new Map<keyof OptionServiceEvents, Set<Function>>();
	private cache = new Map<string, { data: PictographData[]; timestamp: number }>();

	// Core reactive state using $state
	private _state = $state<OptionServiceState>({
		availableOptions: [],
		filteredOptions: [],
		selectedOptions: [],
		isLoading: false,
		error: null,
		currentFilters: {},
		currentSort: null,
		totalCount: 0,
		lastLoadTime: null
	});

	constructor(config: Partial<OptionServiceConfig> = {}) {
		this.config = { ...defaultConfig, ...config };

		// Set default sort if provided
		if (this.config.defaultSort) {
			this._state.currentSort = this.config.defaultSort;
		}
	}

	// Reactive state (read-only)
	get state(): OptionServiceState {
		return this._state;
	}

	// Derived computations using $derived
	get availableOptions(): PictographData[] {
		return this._state.availableOptions;
	}

	get filteredOptions(): PictographData[] {
		return this._state.filteredOptions;
	}

	get selectedOptions(): PictographData[] {
		return this._state.selectedOptions;
	}

	get isLoading(): boolean {
		return this._state.isLoading;
	}

	get error(): string | null {
		return this._state.error;
	}

	get hasOptions(): boolean {
		return this._state.availableOptions.length > 0;
	}

	get optionCount(): number {
		return this._state.filteredOptions.length;
	}

	// Core actions
	async loadOptionsForPosition(position: PictographData): Promise<void> {
		if (this._state.isLoading) {
			console.warn('OptionService: Already loading options, skipping duplicate request');
			return;
		}

		const cacheKey = this.getCacheKey(position);

		// Check cache first
		if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
			const cachedData = this.cache.get(cacheKey)!;
			this.setOptionsData(cachedData.data);
			return;
		}

		this._state.isLoading = true;
		this._state.error = null;

		try {
			console.log('OptionService: Loading options for position:', position.letter);

			// Use existing OptionsService logic
			const options = getNextOptions([position]);

			// Apply max options limit
			const limitedOptions = options.slice(0, this.config.maxOptions);

			// Cache the results
			if (this.config.enableCaching) {
				this.cache.set(cacheKey, {
					data: limitedOptions,
					timestamp: Date.now()
				});
			}

			this.setOptionsData(limitedOptions);
			this.emit('options:loaded', { options: limitedOptions });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error loading options';
			this._state.error = errorMessage;
			this.emit('error', { error: errorMessage });
			console.error('OptionService: Error loading options:', error);
		} finally {
			this._state.isLoading = false;
		}
	}

	clearOptions(): void {
		this._state.availableOptions = [];
		this._state.filteredOptions = [];
		this._state.totalCount = 0;
		this._state.lastLoadTime = null;
		this.emit('options:cleared', {});
	}

	async refreshOptions(): Promise<void> {
		// Clear cache and reload
		this.cache.clear();

		// If we have a previous load context, reload it
		if (this._state.lastLoadTime && this._state.availableOptions.length > 0) {
			// For refresh, we need the original position - this would need to be stored
			// For now, just clear and let the caller reload
			this.clearOptions();
		}
	}

	// Filtering and sorting
	filterOptions(criteria: FilterCriteria): void {
		this._state.currentFilters = { ...criteria };
		this.applyFiltersAndSort();
		this.emit('options:filtered', { options: this._state.filteredOptions });
	}

	sortOptions(criteria: SortCriteria): void {
		this._state.currentSort = criteria;
		this.applyFiltersAndSort();
		this.emit('options:sorted', { options: this._state.filteredOptions });
	}

	clearFilters(): void {
		this._state.currentFilters = {};
		this.applyFiltersAndSort();
		this.emit('options:filtered', { options: this._state.filteredOptions });
	}

	// Selection management
	selectOption(option: PictographData): void {
		if (!this.isOptionSelected(option)) {
			this._state.selectedOptions = [...this._state.selectedOptions, option];
			this.emit('option:selected', { option });
		}
	}

	deselectOption(option: PictographData): void {
		const index = this._state.selectedOptions.findIndex(
			(selected) => selected.letter === option.letter && selected.startPos === option.startPos
		);

		if (index !== -1) {
			this._state.selectedOptions = this._state.selectedOptions.filter((_, i) => i !== index);
			this.emit('option:deselected', { option });
		}
	}

	clearSelection(): void {
		this._state.selectedOptions = [];
		this.emit('selection:cleared', {});
	}

	isOptionSelected(option: PictographData): boolean {
		return this._state.selectedOptions.some(
			(selected) => selected.letter === option.letter && selected.startPos === option.startPos
		);
	}

	// Utility methods
	getOptionsByLetter(letter: string): PictographData[] {
		return this._state.filteredOptions.filter(
			(option) => option.letter?.toString().toLowerCase() === letter.toLowerCase()
		);
	}

	getOptionsByType(type: string): PictographData[] {
		return this._state.filteredOptions.filter((option) => {
			const groupKey = determineGroupKey(option, 'type' as any);
			return groupKey.toLowerCase().includes(type.toLowerCase());
		});
	}

	validateOption(option: PictographData): boolean {
		return !!(option.letter && option.startPos && option.endPos);
	}

	// Private helper methods
	private setOptionsData(options: PictographData[]): void {
		this._state.availableOptions = options;
		this._state.totalCount = options.length;
		this._state.lastLoadTime = new Date();
		this.applyFiltersAndSort();
	}

	private applyFiltersAndSort(): void {
		let filtered = [...this._state.availableOptions];

		// Apply filters
		const filters = this._state.currentFilters;
		if (Object.keys(filters).length > 0) {
			filtered = filtered.filter((option) => {
				if (filters.startPosition && option.startPos !== filters.startPosition) return false;
				if (filters.endPosition && option.endPos !== filters.endPosition) return false;
				if (filters.motionType) {
					const hasMotionType =
						option.blueMotionData?.motionType === filters.motionType ||
						option.redMotionData?.motionType === filters.motionType;
					if (!hasMotionType) return false;
				}
				if (filters.timing && option.timing !== filters.timing) return false;
				if (filters.direction && option.direction !== filters.direction) return false;
				return true;
			});
		}

		// Apply sorting
		if (this._state.currentSort) {
			const sorter = getSorter(this._state.currentSort.field as any);
			if (sorter) {
				filtered.sort((a, b) => {
					const result = sorter(a, b);
					return this._state.currentSort!.direction === 'desc' ? -result : result;
				});
			}
		}

		this._state.filteredOptions = filtered;
	}

	private getCacheKey(position: PictographData): string {
		return `${position.letter || 'unknown'}-${position.endPos || 'unknown'}`;
	}

	private isCacheValid(cacheKey: string): boolean {
		const cached = this.cache.get(cacheKey);
		if (!cached) return false;

		const age = Date.now() - cached.timestamp;
		return age < this.config.cacheTimeout;
	}

	// Event system
	on<K extends keyof OptionServiceEvents>(
		event: K,
		listener: (data: OptionServiceEvents[K]) => void
	): () => void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}

		this.eventListeners.get(event)!.add(listener);

		return () => this.eventListeners.get(event)?.delete(listener);
	}

	private emit<K extends keyof OptionServiceEvents>(event: K, data: OptionServiceEvents[K]): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => listener(data));
		}
	}
}
