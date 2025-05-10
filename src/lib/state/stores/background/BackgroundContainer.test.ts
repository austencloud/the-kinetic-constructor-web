/**
 * Tests for the modern background container
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { backgroundContainer } from './BackgroundContainer';
import { get } from 'svelte/store';
import { backgroundStore } from './backgroundAdapter';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value.toString();
		}),
		clear: vi.fn(() => {
			store = {};
		})
	};
})();

// Mock browser environment
vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('browser', true);

describe('Background Container', () => {
	// Reset the container before each test
	beforeEach(() => {
		backgroundContainer.reset();
		localStorageMock.clear();
	});

	it('should have the correct initial state', () => {
		const state = backgroundContainer.state;
		expect(state.currentBackground).toBe('snowfall');
		expect(state.isReady).toBe(false);
		expect(state.isVisible).toBe(true);
		expect(state.quality).toBe('medium');
		expect(state.performanceMetrics).toBeNull();
		expect(state.availableBackgrounds).toEqual(['snowfall', 'nightSky']);
		expect(state.error).toBeNull();
	});

	it('should update the background', () => {
		backgroundContainer.setBackground('nightSky');
		expect(backgroundContainer.state.currentBackground).toBe('nightSky');
		expect(backgroundContainer.state.isReady).toBe(false); // Should reset ready state
	});

	it('should not update to an invalid background', () => {
		backgroundContainer.setBackground('invalid' as any);
		expect(backgroundContainer.state.currentBackground).toBe('snowfall'); // Should remain unchanged
	});

	it('should update ready state', () => {
		backgroundContainer.setReady(true);
		expect(backgroundContainer.state.isReady).toBe(true);
	});

	it('should update visibility', () => {
		backgroundContainer.setVisible(false);
		expect(backgroundContainer.state.isVisible).toBe(false);
	});

	it('should update quality', () => {
		backgroundContainer.setQuality('high');
		expect(backgroundContainer.state.quality).toBe('high');
	});

	it('should update performance metrics', () => {
		const metrics = { fps: 60, renderTime: 16, warnings: [] };
		backgroundContainer.updatePerformanceMetrics(metrics);
		expect(backgroundContainer.state.performanceMetrics).toEqual(metrics);
	});

	it('should update error state', () => {
		const error = new Error('Test error');
		backgroundContainer.setError(error);
		expect(backgroundContainer.state.error).toBe(error);
	});

	it('should add available backgrounds', () => {
		backgroundContainer.addAvailableBackground('snowfall');
		expect(backgroundContainer.state.availableBackgrounds).toContain('snowfall');
	});

	it('should not add duplicate backgrounds', () => {
		const initialLength = backgroundContainer.state.availableBackgrounds.length;
		backgroundContainer.addAvailableBackground('snowfall');
		expect(backgroundContainer.state.availableBackgrounds.length).toBe(initialLength);
	});

	it('should remove available backgrounds', () => {
		backgroundContainer.removeAvailableBackground('snowfall');
		expect(backgroundContainer.state.availableBackgrounds).not.toContain('snowfall');
	});

	it('should not remove non-existent backgrounds', () => {
		const initialLength = backgroundContainer.state.availableBackgrounds.length;
		backgroundContainer.removeAvailableBackground('nonexistent' as any);
		expect(backgroundContainer.state.availableBackgrounds.length).toBe(initialLength);
	});

	it('should reset to initial state', () => {
		backgroundContainer.setBackground('nightSky');
		backgroundContainer.setReady(true);
		backgroundContainer.setVisible(false);
		backgroundContainer.reset();

		expect(backgroundContainer.state.currentBackground).toBe('snowfall');
		expect(backgroundContainer.state.isReady).toBe(false);
		expect(backgroundContainer.state.isVisible).toBe(true);
	});
});

describe('Background Store Adapter', () => {
	beforeEach(() => {
		backgroundContainer.reset();
		localStorageMock.clear();
	});

	it('should reflect the container state', () => {
		const storeState = get(backgroundStore);
		expect(storeState.currentBackground).toBe('snowfall');
		expect(storeState.isReady).toBe(false);
		expect(storeState.isVisible).toBe(true);
	});

	it('should update the container when the store is updated', () => {
		backgroundStore.setBackground('nightSky');
		expect(backgroundContainer.state.currentBackground).toBe('nightSky');
	});

	it('should update the store when the container is updated', () => {
		backgroundContainer.setBackground('nightSky');
		const storeState = get(backgroundStore);
		expect(storeState.currentBackground).toBe('nightSky');
	});
});
