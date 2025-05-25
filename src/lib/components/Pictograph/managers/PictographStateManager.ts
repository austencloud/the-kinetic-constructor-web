/**
 * Pictograph State Manager
 *
 * This module provides state management functionality for the Pictograph component.
 */

import type { PictographData } from '$lib/types/PictographData';
import { defaultPictographData } from '../utils/defaultPictographData';
import {
	createDataSnapshot,
	hasDataChanged,
	type PictographDataSnapshot
} from '../utils/dataComparison';
import { logger } from '$lib/core/logging';
import { PictographService } from '../PictographService';
import { type Writable, get } from 'svelte/store';

/**
 * Creates a pictograph data state with the provided initial data
 *
 * @param initialData The initial pictograph data
 * @returns A reactive state object containing the pictograph data
 */
export function createPictographDataState(initialData?: PictographData) {
	let data = $state(initialData || defaultPictographData);

	return {
		get data() {
			return data;
		},
		set data(newData: PictographData) {
			data = newData;
		},
		update: (updater: (current: PictographData) => PictographData) => {
			data = updater(data);
		}
	};
}

/**
 * Initializes the pictograph service with the current data
 *
 * @param pictographData The pictograph data
 * @returns The initialized pictograph service
 */
export function initializePictographService(pictographData: PictographData): PictographService {
	return new PictographService(pictographData);
}

/**
 * Legacy function for backward compatibility with store-based approach
 * @deprecated Use initializePictographService with direct data instead
 */
export function initializePictographServiceFromStore(pictographDataStore: any): PictographService {
	// For backward compatibility, try to get data from store
	const data =
		typeof pictographDataStore?.data === 'function'
			? pictographDataStore.data()
			: pictographDataStore?.data || defaultPictographData;
	return new PictographService(data);
}

/**
 * Checks if the pictograph data has changed
 *
 * @param newData The new pictograph data
 * @param lastDataSnapshot The last data snapshot for comparison
 * @returns True if the data has changed, along with the updated snapshot
 */
export function checkForDataChanges(
	newData: PictographData,
	lastDataSnapshot: PictographDataSnapshot | null
): { hasChanged: boolean; updatedSnapshot: PictographDataSnapshot } {
	// If this is the first time, always return true
	if (!lastDataSnapshot) {
		// Update last known values for safe comparison next time
		const updatedSnapshot = createDataSnapshot(newData);
		return { hasChanged: true, updatedSnapshot };
	}

	try {
		// Use the utility function to check for changes
		const fieldsChanged = hasDataChanged(newData, lastDataSnapshot);

		// Create updated snapshot if changed
		const updatedSnapshot = fieldsChanged ? createDataSnapshot(newData) : lastDataSnapshot;

		return { hasChanged: fieldsChanged, updatedSnapshot };
	} catch (error) {
		logger.warn('Error comparing pictograph data:', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		// Assume changed on error to be safe
		return { hasChanged: true, updatedSnapshot: createDataSnapshot(newData) };
	}
}

/**
 * Updates the pictograph components based on the current data
 *
 * @param pictographDataStore The pictograph data store
 * @param service The pictograph service
 * @param state The current state
 * @param errorMessage The current error message
 * @param gridData The current grid data
 * @param createAndPositionComponents Function to create and position components
 * @param requiredComponents Array of required component names
 * @param hasRequiredMotionData Function to check if the data has required motion data
 * @returns Updated state information
 */
export function updateComponentsFromData(
	pictographDataStore: Writable<PictographData>,
	service: PictographService | null,
	state: string,
	errorMessage: string | null,
	gridData: any,
	createAndPositionComponents: () => void,
	requiredComponents: string[],
	loadedComponents: Set<string>,
	hasRequiredMotionData: (data: PictographData | undefined) => boolean
): { state: string; errorMessage: string | null; renderCount: number } {
	try {
		// Reset state if needed
		let newState = state;
		let newErrorMessage = errorMessage;
		let renderCount = 0;

		if (state === 'error') {
			newState = 'loading';
			newErrorMessage = null;
		}

		// Make sure we have data to work with
		if (!get(pictographDataStore)) {
			newState = 'grid_only';
			return { state: newState, errorMessage: newErrorMessage, renderCount };
		}

		// Update state based on available motion data
		if (hasRequiredMotionData(get(pictographDataStore))) {
			if (state === 'grid_only') newState = 'loading';
		} else {
			newState = 'grid_only';
		}

		// Only recreate components if grid data is available
		if (gridData) {
			// Create and position components
			createAndPositionComponents();

			// Update rendering count
			renderCount++;

			// If all required components were already loaded previously,
			// mark as complete immediately
			if (requiredComponents.every((comp) => loadedComponents.has(comp))) {
				newState = 'complete';
			}
		}

		return { state: newState, errorMessage: newErrorMessage, renderCount };
	} catch (error) {
		logger.error('Error updating components from data:', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		return { state: 'error', errorMessage: String(error), renderCount: 0 };
	}
}

/**
 * Sets up a subscription to the pictograph data store
 *
 * @param pictographDataStore The pictograph data store
 * @param service The pictograph service
 * @param lastDataSnapshot The last data snapshot for comparison
 * @param updateComponentsFromData Function to update components from data
 * @param dispatch Function to dispatch events
 * @param debug Whether debug mode is enabled
 * @returns A function to unsubscribe from the store
 */
export function setupPictographDataSubscription(
	pictographDataStore: Writable<PictographData>,
	service: PictographService | null,
	lastDataSnapshot: PictographDataSnapshot | null,
	updateComponentsFn: () => void,
	dispatch: (event: string, detail?: any) => void,
	debug: boolean,
	checkForChanges: (
		data: PictographData,
		snapshot: PictographDataSnapshot | null
	) => { hasChanged: boolean; updatedSnapshot: PictographDataSnapshot }
): { unsubscribe: () => void; getSnapshot: () => PictographDataSnapshot | null } {
	let currentSnapshot = lastDataSnapshot;

	// Add update throttling to prevent infinite loops
	let lastUpdateTime = 0;
	const MIN_UPDATE_INTERVAL = 100; // ms - increased to reduce update frequency
	let updateCount = 0;
	const MAX_UPDATES_PER_SECOND = 10; // reduced to be more conservative
	let lastResetTime = Date.now();
	let isProcessingUpdate = false; // Flag to prevent concurrent updates
	let pendingData: PictographData | null = null; // Store pending updates
	let updateTimeoutId: any = null; // For debouncing

	const unsubscribe = pictographDataStore.subscribe((data) => {
		if (!data || !service) return;

		// Store the latest data
		pendingData = data;

		// If we're already processing an update, don't start another one
		if (isProcessingUpdate) {
			return;
		}

		// Throttle updates to prevent infinite loops
		const now = Date.now();

		// Reset counter every second
		if (now - lastResetTime > 1000) {
			updateCount = 0;
			lastResetTime = now;
		}

		// Check if we're updating too frequently
		if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
			updateCount++;

			// If we're updating too frequently, log a warning and debounce
			if (updateCount > MAX_UPDATES_PER_SECOND) {
				if (debug) console.warn('Pictograph update throttled to prevent infinite loop');

				// Clear any existing timeout
				if (updateTimeoutId) {
					clearTimeout(updateTimeoutId);
				}

				// Set a new timeout to process the update later
				updateTimeoutId = setTimeout(() => {
					processUpdate(pendingData);
					pendingData = null;
				}, 200); // Wait longer when throttling

				return;
			}
		}

		// Process the update immediately
		processUpdate(data);
	});

	// Function to process updates with proper state tracking
	function processUpdate(data: PictographData | null) {
		if (!data || !service) return;

		// Mark that we're processing an update
		isProcessingUpdate = true;

		// Update the last update time
		lastUpdateTime = Date.now();

		// Use a safe comparison method that avoids circular references
		const { hasChanged, updatedSnapshot } = checkForChanges(data, currentSnapshot);

		// Only update the snapshot if there's a real change
		if (hasChanged) {
			currentSnapshot = updatedSnapshot;

			if (debug) console.debug('Pictograph data changed, updating components');

			// Update the service with new data
			service.updateData(data);

			// Update local state
			updateComponentsFn();

			// Notify parent about the update
			dispatch('dataUpdated', { type: 'all' });
		}

		// Reset processing flag when done
		isProcessingUpdate = false;
	}

	return {
		unsubscribe,
		getSnapshot: () => currentSnapshot
	};
}
