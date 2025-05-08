/**
 * Background Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { backgroundStore } from './background.store';
import {
	selectCurrentBackground,
	selectIsBackgroundReady,
	selectHasBackgroundError,
	selectBackgroundFps
} from './background.selectors';
import type { PerformanceMetrics } from '$lib/components/Backgrounds/types/types';

describe('Background Store', () => {
	beforeEach(() => {
		// Reset the store before each test
		backgroundStore.reset();
	});

	it('should have the correct initial state', () => {
		const state = get(backgroundStore);
		expect(state.currentBackground).toBe('snowfall');
		expect(state.isReady).toBe(false);
		expect(state.isVisible).toBe(true);
		expect(state.quality).toBe('medium');
		expect(state.performanceMetrics).toBeNull();
		expect(state.availableBackgrounds).toEqual(['snowfall', 'nightSky']);
		expect(state.error).toBeNull();
	});

	it('should set background', () => {
		backgroundStore.setBackground('nightSky');

		const state = get(backgroundStore);
		expect(state.currentBackground).toBe('nightSky');
		expect(state.isReady).toBe(false); // Should reset ready state
		expect(get(selectCurrentBackground)).toBe('nightSky');
	});

	it('should validate background type', () => {
		// @ts-ignore - Testing invalid type
		backgroundStore.setBackground('invalidType');

		const state = get(backgroundStore);
		expect(state.currentBackground).toBe('snowfall'); // Should not change
	});

	it('should set ready state', () => {
		backgroundStore.setReady(true);

		const state = get(backgroundStore);
		expect(state.isReady).toBe(true);
		expect(get(selectIsBackgroundReady)).toBe(true);
	});

	it('should set visibility', () => {
		backgroundStore.setVisible(false);

		const state = get(backgroundStore);
		expect(state.isVisible).toBe(false);
	});

	it('should set quality', () => {
		backgroundStore.setQuality('high');

		const state = get(backgroundStore);
		expect(state.quality).toBe('high');
	});

	it('should update performance metrics', () => {
		const metrics: PerformanceMetrics = {
			fps: 60,
			warnings: ['Test warning'],
			particleCount: 1000,
			renderTime: 16,
			memoryUsage: 50
		};

		backgroundStore.updatePerformanceMetrics(metrics);

		const state = get(backgroundStore);
		expect(state.performanceMetrics).toEqual(metrics);
		expect(get(selectBackgroundFps)).toBe(60);
	});

	it('should set error', () => {
		const error = new Error('Test error');
		backgroundStore.setError(error);

		const state = get(backgroundStore);
		expect(state.error).toBe(error);
		expect(get(selectHasBackgroundError)).toBe(true);

		// Clear error
		backgroundStore.setError(null);
		expect(get(backgroundStore).error).toBeNull();
		expect(get(selectHasBackgroundError)).toBe(false);
	});
});
