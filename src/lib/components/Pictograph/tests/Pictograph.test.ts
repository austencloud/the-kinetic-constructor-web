/**
 * Pictograph Component Tests
 *
 * Tests for the Pictograph component with both old and new state management.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import Pictograph from '../Pictograph.svelte';
import { pictographStore } from '$lib/state/stores/pictograph/pictograph.store';
import type { PictographData } from '$lib/types/PictographData';

// Mock the onMount function to make it work in the test environment
vi.mock('svelte', () => {
	const actual = vi.importActual('svelte');
	return {
		...(actual as any),
		onMount: (fn: () => any) => {
			fn(); // Execute the function immediately
			return () => {}; // Return a cleanup function
		}
	};
});

// Mock the Grid component since we don't need to test it here
vi.mock('$lib/components/objects/Grid/Grid.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		$$: { callbacks: {} }
	}))
}));

// Mock the logger to avoid console output during tests
vi.mock('$lib/core/logging', () => ({
	logger: {
		info: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		pictograph: vi.fn()
	}
}));

// Import the Letter type
import type { Letter } from '$lib/types/Letter';

// Mock default pictograph data
const mockPictographData: PictographData = {
	letter: 'A' as Letter,
	gridMode: 'diamond',
	grid: 'diamond',
	startPos: null,
	endPos: null,
	timing: null,
	direction: null,
	blueMotionData: null,
	redMotionData: null,
	gridData: null,
	redPropData: null,
	bluePropData: null,
	redArrowData: null,
	blueArrowData: null,
	motions: [],
	redMotion: null,
	blueMotion: null,
	props: []
};

describe('Pictograph Component', () => {
	beforeEach(() => {
		// Reset the pictograph store before each test
		pictographStore.setData(mockPictographData);
		vi.clearAllMocks();
	});

	it('should render with local store data (backward compatibility)', () => {
		// Create a local store with test data
		const localStore = writable<PictographData>(mockPictographData);

		// Render the component with the local store
		const { container } = render(Pictograph, {
			pictographDataStore: localStore
		});

		// Check that the component renders
		expect(container.querySelector('.pictograph-wrapper')).not.toBeNull();

		// Check that it has the correct letter attribute
		expect(container.querySelector('.pictograph-wrapper')?.getAttribute('data-letter')).toBe('A');
	});

	it('should render with pictographStore data when no local store is provided', () => {
		// Set data in the pictograph store
		pictographStore.setData({
			...mockPictographData,
			letter: 'B' as Letter
		});

		// Render the component without a local store
		const { container } = render(Pictograph);

		// Check that the component renders
		expect(container.querySelector('.pictograph-wrapper')).not.toBeNull();

		// Check that it has the correct letter attribute from the global store
		expect(container.querySelector('.pictograph-wrapper')?.getAttribute('data-letter')).toBe('B');
	});

	it('should prioritize local store data over pictographStore data', () => {
		// Set data in the pictograph store
		pictographStore.setData({
			...mockPictographData,
			letter: 'B' as Letter
		});

		// Create a local store with different data
		const localStore = writable<PictographData>({
			...mockPictographData,
			letter: 'C' as Letter
		});

		// Render the component with the local store
		const { container } = render(Pictograph, {
			pictographDataStore: localStore
		});

		// Check that it uses the local store data
		expect(container.querySelector('.pictograph-wrapper')?.getAttribute('data-letter')).toBe('C');
	});

	it('should handle click events', () => {
		// Create a mock click handler
		const handleClick = vi.fn();

		// Render the component with the click handler
		const { container } = render(Pictograph, {
			pictographDataStore: writable(mockPictographData),
			onClick: handleClick
		});

		// Simulate a click on the pictograph
		fireEvent.click(container.querySelector('.pictograph-wrapper')!);

		// Check that the click handler was called
		expect(handleClick).toHaveBeenCalled();
	});

	it('should handle errors gracefully', () => {
		// Create a local store with invalid data
		const localStore = writable<PictographData>({
			...mockPictographData,
			gridMode: 'invalid' as any
		});

		// Render the component with the invalid data
		const { container } = render(Pictograph, {
			pictographDataStore: localStore
		});

		// The component should still render without crashing
		expect(container.querySelector('.pictograph-wrapper')).not.toBeNull();
	});
});
