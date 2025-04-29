/**
 * Unit tests for the Browse Tab Store
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
	browseTabStore,
	filteredSequences,
	sortedSequences,
	groupedSequences,
	selectedSequenceData
} from '../browseTabStore';
import type { SequenceData } from '../browseTabStore';

// Mock the sequence service
vi.mock('$lib/services/sequenceService');

// Import after mocking
import * as sequenceService from '$lib/services/sequenceService';

// Mock the $app/environment module
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Browse Tab Store', () => {
	// Reset the store before each test
	beforeEach(async () => {
		vi.resetAllMocks();
		localStorage.clear();

		// Set up mock data
		const mockSequences = [
			{
				id: '1',
				word: 'Alpha',
				variations: [
					{
						id: '1-1',
						thumbnailPath: '/images/sequences/alpha-1.png',
						metadata: {
							level: 1,
							author: 'John Doe',
							dateAdded: '2023-01-15',
							gridMode: 'diamond',
							startingPosition: 'home',
							isFavorite: true,
							length: 4,
							tags: ['beginner', 'tutorial']
						}
					},
					{
						id: '1-2',
						thumbnailPath: '/images/sequences/alpha-2.png',
						metadata: {
							level: 1,
							author: 'John Doe',
							dateAdded: '2023-01-16',
							gridMode: 'diamond',
							startingPosition: 'home',
							isFavorite: false,
							length: 4,
							tags: ['beginner', 'tutorial']
						}
					}
				],
				metadata: {
					level: 1,
					author: 'John Doe',
					dateAdded: '2023-01-15',
					gridMode: 'diamond',
					startingPosition: 'home',
					length: 4,
					tags: ['beginner', 'tutorial']
				}
			},
			{
				id: '2',
				word: 'Beta',
				variations: [
					{
						id: '2-1',
						thumbnailPath: '/images/sequences/beta-1.png',
						metadata: {
							level: 2,
							author: 'Jane Smith',
							dateAdded: '2023-02-10',
							gridMode: 'box',
							startingPosition: 'extended',
							isFavorite: false,
							length: 6,
							tags: ['intermediate']
						}
					}
				],
				metadata: {
					level: 2,
					author: 'Jane Smith',
					dateAdded: '2023-02-10',
					gridMode: 'box',
					startingPosition: 'extended',
					length: 6,
					tags: ['intermediate']
				}
			},
			{
				id: '3',
				word: 'Gamma',
				variations: [
					{
						id: '3-1',
						thumbnailPath: '/images/sequences/gamma-1.png',
						metadata: {
							level: 3,
							author: 'Alex Johnson',
							dateAdded: '2023-03-05',
							gridMode: 'diamond',
							startingPosition: 'split',
							isFavorite: true,
							length: 8,
							tags: ['advanced', 'complex']
						}
					}
				],
				metadata: {
					level: 3,
					author: 'Alex Johnson',
					dateAdded: '2023-03-05',
					gridMode: 'diamond',
					startingPosition: 'split',
					length: 8,
					tags: ['advanced', 'complex']
				}
			}
		];

		// Set up mocks
		vi.mocked(sequenceService.fetchSequences).mockResolvedValue(mockSequences);
		vi.mocked(sequenceService.updateFavoriteStatus).mockResolvedValue(undefined);
		vi.mocked(sequenceService.deleteVariationApi).mockResolvedValue(undefined);
		vi.mocked(sequenceService.deleteSequenceApi).mockResolvedValue(undefined);

		// Reset the store to its initial state
		browseTabStore.applyFilter({ type: 'all' });
		browseTabStore.applySort({ field: 'alphabetical', direction: 'asc' });

		// Load initial data for each test
		await browseTabStore.loadInitialData();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Initial State', () => {
		it('should have the correct initial state', () => {
			const state = get(browseTabStore);

			// After our beforeEach, allSequences will be populated with mock data
			expect(state.allSequences.length).toEqual(3);
			expect(state.currentFilter).toEqual({ type: 'all' });
			expect(state.currentSort).toEqual({ field: 'alphabetical', direction: 'asc' });
			expect(state.selectedSequenceId).toBeNull();
			expect(state.selectedVariationIndex).toBe(0);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
		});
	});

	describe('Data Loading', () => {
		it('should load sequence data', async () => {
			await browseTabStore.loadInitialData();

			const state = get(browseTabStore);

			expect(state.allSequences.length).toBe(3);
			expect(state.allSequences[0].word).toBe('Alpha');
			expect(state.allSequences[1].word).toBe('Beta');
			expect(state.allSequences[2].word).toBe('Gamma');
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
		});

		it('should set isLoading to true while loading', async () => {
			const loadPromise = browseTabStore.loadInitialData();

			// Check that isLoading is true during loading
			expect(get(browseTabStore).isLoading).toBe(true);

			await loadPromise;

			// Check that isLoading is false after loading
			expect(get(browseTabStore).isLoading).toBe(false);
		});

		it('should handle loading errors', async () => {
			// Mock the fetchSequences function to throw an error
			vi.mocked(sequenceService.fetchSequences).mockRejectedValueOnce(
				new Error('Failed to fetch sequences')
			);

			await browseTabStore.loadInitialData();

			const state = get(browseTabStore);

			expect(state.isLoading).toBe(false);
			expect(state.error).toBe('Failed to fetch sequences');
		});
	});

	describe('Filtering', () => {
		beforeEach(async () => {
			await browseTabStore.loadInitialData();
		});

		it('should filter by "all"', () => {
			browseTabStore.applyFilter({ type: 'all' });

			const filtered = get(filteredSequences);

			expect(filtered.length).toBe(3);
		});

		it('should filter by "favorites"', () => {
			browseTabStore.applyFilter({ type: 'favorites' });

			const filtered = get(filteredSequences);

			expect(filtered.length).toBe(2);
			expect(filtered[0].word).toBe('Alpha');
			expect(filtered[1].word).toBe('Gamma');
		});

		it('should filter by "tag"', () => {
			browseTabStore.applyFilter({ type: 'tag', value: 'beginner' });

			const filtered = get(filteredSequences);

			expect(filtered.length).toBe(1);
			expect(filtered[0].word).toBe('Alpha');
		});

		it('should filter by "difficulty"', () => {
			browseTabStore.applyFilter({ type: 'difficulty', value: 2 });

			const filtered = get(filteredSequences);

			expect(filtered.length).toBe(1);
			expect(filtered[0].word).toBe('Beta');
		});

		it('should filter by "startingPosition"', () => {
			browseTabStore.applyFilter({ type: 'startingPosition', value: 'split' });

			const filtered = get(filteredSequences);

			expect(filtered.length).toBe(1);
			expect(filtered[0].word).toBe('Gamma');
		});

		it('should filter by "startingLetter"', () => {
			browseTabStore.applyFilter({ type: 'startingLetter', value: 'A' });

			const filtered = get(filteredSequences);

			expect(filtered.length).toBe(1);
			expect(filtered[0].word).toBe('Alpha');
		});

		it('should filter by "containsLetters"', () => {
			browseTabStore.applyFilter({ type: 'containsLetters', value: ['a', 'm'] });

			const filtered = get(filteredSequences);

			// Only Alpha and Gamma contain both 'a' and 'm'
			expect(filtered.length).toBe(1);
			expect(filtered[0].word).toBe('Gamma');
		});

		it('should filter by "length"', () => {
			browseTabStore.applyFilter({ type: 'length', value: 8 });

			const filtered = get(filteredSequences);

			expect(filtered.length).toBe(1);
			expect(filtered[0].word).toBe('Gamma');
		});

		it('should filter by "gridMode"', () => {
			browseTabStore.applyFilter({ type: 'gridMode', value: 'box' });

			const filtered = get(filteredSequences);

			expect(filtered.length).toBe(1);
			expect(filtered[0].word).toBe('Beta');
		});

		it('should reset selection when filter changes', () => {
			// First select a sequence
			browseTabStore.selectSequence('1');

			// Then apply a filter
			browseTabStore.applyFilter({ type: 'difficulty', value: 3 });

			const state = get(browseTabStore);

			expect(state.selectedSequenceId).toBeNull();
			expect(state.selectedVariationIndex).toBe(0);
		});
	});

	describe('Sorting', () => {
		beforeEach(async () => {
			await browseTabStore.loadInitialData();
		});

		it('should sort alphabetically (asc)', () => {
			browseTabStore.applySort({ field: 'alphabetical', direction: 'asc' });

			const sorted = get(sortedSequences);

			expect(sorted.length).toBe(3);
			expect(sorted[0].word).toBe('Alpha');
			expect(sorted[1].word).toBe('Beta');
			expect(sorted[2].word).toBe('Gamma');
		});

		it('should sort alphabetically (desc)', () => {
			browseTabStore.applySort({ field: 'alphabetical', direction: 'desc' });

			const sorted = get(sortedSequences);

			expect(sorted.length).toBe(3);
			expect(sorted[0].word).toBe('Gamma');
			expect(sorted[1].word).toBe('Beta');
			expect(sorted[2].word).toBe('Alpha');
		});

		it('should sort by difficulty (asc)', () => {
			browseTabStore.applySort({ field: 'difficulty', direction: 'asc' });

			const sorted = get(sortedSequences);

			expect(sorted.length).toBe(3);
			expect(sorted[0].word).toBe('Alpha');
			expect(sorted[1].word).toBe('Beta');
			expect(sorted[2].word).toBe('Gamma');
		});

		it('should sort by difficulty (desc)', () => {
			browseTabStore.applySort({ field: 'difficulty', direction: 'desc' });

			const sorted = get(sortedSequences);

			expect(sorted.length).toBe(3);
			expect(sorted[0].word).toBe('Gamma');
			expect(sorted[1].word).toBe('Beta');
			expect(sorted[2].word).toBe('Alpha');
		});

		it('should sort by dateAdded (asc)', () => {
			browseTabStore.applySort({ field: 'dateAdded', direction: 'asc' });

			const sorted = get(sortedSequences);

			expect(sorted.length).toBe(3);
			expect(sorted[0].word).toBe('Alpha');
			expect(sorted[1].word).toBe('Beta');
			expect(sorted[2].word).toBe('Gamma');
		});

		it('should sort by dateAdded (desc)', () => {
			browseTabStore.applySort({ field: 'dateAdded', direction: 'desc' });

			const sorted = get(sortedSequences);

			expect(sorted.length).toBe(3);
			expect(sorted[0].word).toBe('Gamma');
			expect(sorted[1].word).toBe('Beta');
			expect(sorted[2].word).toBe('Alpha');
		});

		it('should sort by length (asc)', () => {
			browseTabStore.applySort({ field: 'length', direction: 'asc' });

			const sorted = get(sortedSequences);

			expect(sorted.length).toBe(3);
			expect(sorted[0].word).toBe('Alpha');
			expect(sorted[1].word).toBe('Beta');
			expect(sorted[2].word).toBe('Gamma');
		});

		it('should sort by length (desc)', () => {
			browseTabStore.applySort({ field: 'length', direction: 'desc' });

			const sorted = get(sortedSequences);

			expect(sorted.length).toBe(3);
			expect(sorted[0].word).toBe('Gamma');
			expect(sorted[1].word).toBe('Beta');
			expect(sorted[2].word).toBe('Alpha');
		});
	});

	describe('Grouping', () => {
		beforeEach(async () => {
			await browseTabStore.loadInitialData();
		});

		it('should group by first letter when sorting alphabetically', () => {
			browseTabStore.applySort({ field: 'alphabetical', direction: 'asc' });

			const grouped = get(groupedSequences);

			expect(grouped.length).toBe(3);
			expect(grouped[0].section).toBe('A');
			expect(grouped[0].sequences.length).toBe(1);
			expect(grouped[0].sequences[0].word).toBe('Alpha');

			expect(grouped[1].section).toBe('B');
			expect(grouped[1].sequences.length).toBe(1);
			expect(grouped[1].sequences[0].word).toBe('Beta');

			expect(grouped[2].section).toBe('G');
			expect(grouped[2].sequences.length).toBe(1);
			expect(grouped[2].sequences[0].word).toBe('Gamma');
		});

		it('should group by difficulty level when sorting by difficulty', () => {
			browseTabStore.applySort({ field: 'difficulty', direction: 'asc' });

			const grouped = get(groupedSequences);

			expect(grouped.length).toBe(3);
			expect(grouped[0].section).toBe('Level 1');
			expect(grouped[0].sequences.length).toBe(1);
			expect(grouped[0].sequences[0].word).toBe('Alpha');

			expect(grouped[1].section).toBe('Level 2');
			expect(grouped[1].sequences.length).toBe(1);
			expect(grouped[1].sequences[0].word).toBe('Beta');

			expect(grouped[2].section).toBe('Level 3');
			expect(grouped[2].sequences.length).toBe(1);
			expect(grouped[2].sequences[0].word).toBe('Gamma');
		});

		it('should group by month/year when sorting by dateAdded', () => {
			browseTabStore.applySort({ field: 'dateAdded', direction: 'asc' });

			const grouped = get(groupedSequences);

			expect(grouped.length).toBe(3);
			// Note: The exact month names will depend on the locale, so we'll just check the structure
			expect(grouped[0].sequences.length).toBe(1);
			expect(grouped[0].sequences[0].word).toBe('Alpha');

			expect(grouped[1].sequences.length).toBe(1);
			expect(grouped[1].sequences[0].word).toBe('Beta');

			expect(grouped[2].sequences.length).toBe(1);
			expect(grouped[2].sequences[0].word).toBe('Gamma');
		});

		it('should group by length when sorting by length', () => {
			browseTabStore.applySort({ field: 'length', direction: 'asc' });

			const grouped = get(groupedSequences);

			expect(grouped.length).toBe(3);
			expect(grouped[0].section).toBe('4 Beats');
			expect(grouped[0].sequences.length).toBe(1);
			expect(grouped[0].sequences[0].word).toBe('Alpha');

			expect(grouped[1].section).toBe('6 Beats');
			expect(grouped[1].sequences.length).toBe(1);
			expect(grouped[1].sequences[0].word).toBe('Beta');

			expect(grouped[2].section).toBe('8 Beats');
			expect(grouped[2].sequences.length).toBe(1);
			expect(grouped[2].sequences[0].word).toBe('Gamma');
		});
	});

	describe('Sequence Selection', () => {
		beforeEach(async () => {
			await browseTabStore.loadInitialData();
		});

		it('should select a sequence', () => {
			browseTabStore.selectSequence('2');

			const state = get(browseTabStore);

			expect(state.selectedSequenceId).toBe('2');
			expect(state.selectedVariationIndex).toBe(0);
		});

		it('should not select a non-existent sequence', () => {
			browseTabStore.selectSequence('999');

			const state = get(browseTabStore);

			expect(state.selectedSequenceId).toBeNull();
		});

		it('should select a variation', () => {
			// First select a sequence with multiple variations
			browseTabStore.selectSequence('1');

			// Then select the second variation
			browseTabStore.selectVariation(1);

			const state = get(browseTabStore);

			expect(state.selectedSequenceId).toBe('1');
			expect(state.selectedVariationIndex).toBe(1);
		});

		it('should not select an out-of-bounds variation', () => {
			// First select a sequence
			browseTabStore.selectSequence('1');

			// Then try to select an invalid variation
			browseTabStore.selectVariation(999);

			const state = get(browseTabStore);

			expect(state.selectedSequenceId).toBe('1');
			expect(state.selectedVariationIndex).toBe(0); // Should remain at the default
		});

		it('should provide the selected sequence and variation via the derived store', () => {
			// Select a sequence and variation
			browseTabStore.selectSequence('1');
			browseTabStore.selectVariation(1);

			const selected = get(selectedSequenceData);

			expect(selected.sequence).not.toBeNull();
			expect(selected.sequence?.id).toBe('1');
			expect(selected.sequence?.word).toBe('Alpha');

			expect(selected.variation).not.toBeNull();
			expect(selected.variation?.id).toBe('1-2');
		});
	});

	describe('Favorite Toggle', () => {
		beforeEach(async () => {
			await browseTabStore.loadInitialData();
		});

		it('should toggle favorite status', async () => {
			// Get the initial state
			const initialState = get(browseTabStore);
			const sequence = initialState.allSequences.find((seq) => seq.id === '1');
			const variation = sequence?.variations.find((v) => v.id === '1-1');
			const initialFavorite = variation?.metadata.isFavorite || false;

			// Toggle favorite
			await browseTabStore.toggleFavorite('1', '1-1');

			// Get the updated state
			const updatedState = get(browseTabStore);
			const updatedSequence = updatedState.allSequences.find((seq) => seq.id === '1');
			const updatedVariation = updatedSequence?.variations.find((v) => v.id === '1-1');
			const updatedFavorite = updatedVariation?.metadata.isFavorite || false;

			// Check that the favorite status was toggled
			expect(updatedFavorite).toBe(!initialFavorite);
		});

		it('should handle errors when toggling favorite status', async () => {
			// Mock the updateFavoriteStatus function to throw an error
			vi.mocked(sequenceService.updateFavoriteStatus).mockRejectedValueOnce(
				new Error('Failed to update favorite status')
			);

			// Toggle favorite
			await browseTabStore.toggleFavorite('1', '1-1');

			// Get the updated state
			const updatedState = get(browseTabStore);

			// Check that the error was set
			expect(updatedState.error).toBe('Failed to update favorite status');
		});
	});

	describe('Deletion', () => {
		beforeEach(async () => {
			await browseTabStore.loadInitialData();
		});

		it('should delete a variation', async () => {
			// Get the initial state
			const initialState = get(browseTabStore);
			const initialSequenceCount = initialState.allSequences.length;
			const initialVariationCount =
				initialState.allSequences.find((seq) => seq.id === '1')?.variations.length || 0;

			// Delete a variation
			await browseTabStore.deleteVariation('1', '1-2');

			// Get the updated state
			const updatedState = get(browseTabStore);
			const updatedSequenceCount = updatedState.allSequences.length;
			const updatedVariationCount =
				updatedState.allSequences.find((seq) => seq.id === '1')?.variations.length || 0;

			// Check that the variation was deleted
			expect(updatedSequenceCount).toBe(initialSequenceCount);
			expect(updatedVariationCount).toBe(initialVariationCount - 1);
		});

		it('should delete a sequence when its last variation is deleted', async () => {
			// Get the initial state
			const initialState = get(browseTabStore);
			const initialSequenceCount = initialState.allSequences.length;

			// Delete the only variation of a sequence
			await browseTabStore.deleteVariation('2', '2-1');

			// Get the updated state
			const updatedState = get(browseTabStore);
			const updatedSequenceCount = updatedState.allSequences.length;

			// Check that the sequence was deleted
			expect(updatedSequenceCount).toBe(initialSequenceCount - 1);
			expect(updatedState.allSequences.find((seq) => seq.id === '2')).toBeUndefined();
		});

		it('should delete an entire sequence', async () => {
			// Get the initial state
			const initialState = get(browseTabStore);
			const initialSequenceCount = initialState.allSequences.length;

			// Delete a sequence
			await browseTabStore.deleteSequence('1');

			// Get the updated state
			const updatedState = get(browseTabStore);
			const updatedSequenceCount = updatedState.allSequences.length;

			// Check that the sequence was deleted
			expect(updatedSequenceCount).toBe(initialSequenceCount - 1);
			expect(updatedState.allSequences.find((seq) => seq.id === '1')).toBeUndefined();
		});

		it('should handle errors when deleting a variation', async () => {
			// Mock the deleteVariationApi function to throw an error
			vi.mocked(sequenceService.deleteVariationApi).mockRejectedValueOnce(
				new Error('Failed to delete variation')
			);

			// Delete a variation
			await browseTabStore.deleteVariation('1', '1-1');

			// Get the updated state
			const updatedState = get(browseTabStore);

			// Check that the error was set
			expect(updatedState.error).toBe('Failed to delete variation');
		});

		it('should handle errors when deleting a sequence', async () => {
			// Mock the deleteSequenceApi function to throw an error
			vi.mocked(sequenceService.deleteSequenceApi).mockRejectedValueOnce(
				new Error('Failed to delete sequence')
			);

			// Delete a sequence
			await browseTabStore.deleteSequence('1');

			// Get the updated state
			const updatedState = get(browseTabStore);

			// Check that the error was set
			expect(updatedState.error).toBe('Failed to delete sequence');
		});
	});

	describe('Error Handling', () => {
		it('should clear errors', async () => {
			// Set an error by mocking a failed fetch
			vi.mocked(sequenceService.fetchSequences).mockRejectedValueOnce(
				new Error('Failed to fetch sequences')
			);

			// Trigger the error
			await browseTabStore.loadInitialData();

			// Check that the error was set
			expect(get(browseTabStore).error).toBe('Failed to fetch sequences');

			// Clear the error
			browseTabStore.clearError();

			// Check that the error was cleared
			expect(get(browseTabStore).error).toBeNull();
		});
	});

	describe('Persistence', () => {
		it('should save filter and sort preferences to localStorage', () => {
			// Reset the spy counts
			vi.clearAllMocks();

			// Apply a filter and sort
			browseTabStore.applyFilter({ type: 'difficulty', value: 3 });
			browseTabStore.applySort({ field: 'dateAdded', direction: 'desc' });

			// Manually trigger persistence
			browseTabStore.saveState();

			// Check that localStorage was called with the correct data
			expect(localStorage.setItem).toHaveBeenCalledWith(
				'browseTabState',
				expect.stringContaining('"currentFilter":{"type":"difficulty","value":3}')
			);
			expect(localStorage.setItem).toHaveBeenCalledWith(
				'browseTabState',
				expect.stringContaining('"currentSort":{"field":"dateAdded","direction":"desc"}')
			);
		});

		it('should load filter and sort preferences from localStorage', () => {
			// Reset the spy counts
			vi.clearAllMocks();

			// Mock localStorage.getItem to return specific data
			vi.mocked(localStorage.getItem).mockReturnValueOnce(
				JSON.stringify({
					currentFilter: { type: 'tag', value: 'advanced' },
					currentSort: { field: 'length', direction: 'desc' }
				})
			);

			// Manually trigger loading from localStorage
			browseTabStore.loadState();

			// Check that localStorage.getItem was called with the correct key
			expect(localStorage.getItem).toHaveBeenCalledWith('browseTabState');

			// Check that the store state was updated correctly
			const state = get(browseTabStore);
			expect(state.currentFilter).toEqual({ type: 'tag', value: 'advanced' });
			expect(state.currentSort).toEqual({ field: 'length', direction: 'desc' });
		});
	});
});
