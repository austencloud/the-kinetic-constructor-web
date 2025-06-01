/**
 * UI Transition Integration Test - RightPanel
 * Tests the reactive state logic that drives UI transitions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import { workbenchStore } from '$lib/state/stores/workbenchStore';
import type { PictographData } from '$lib/types/PictographData';
import { Letter } from '$lib/types/Letter';
import {
	initializeTestDataLoader,
	getTestPictographByLetter,
	resetTestData
} from '$lib/utils/tests/pictographTestHelpers';

describe('UI Transition Integration Test - RightPanel Service Logic', () => {
	let sequenceService: SequenceService;

	beforeEach(async () => {
		// Initialize test data loader with real pictograph data
		await initializeTestDataLoader();

		// Create fresh service instances for each test
		sequenceService = new SequenceService({
			autoSave: false,
			maxBeats: 100,
			enablePlayback: false
		});

		// Set workbench to construct tab (required for TransitionWrapper to show)
		workbenchStore.update((state) => ({
			...state,
			activeTab: 'construct'
		}));
	});

	afterEach(() => {
		// Clean up test data
		resetTestData();

		// Reset workbench store to default state
		workbenchStore.update((state) => ({
			...state,
			activeTab: 'generate'
		}));
	});

	it('should determine UI state correctly when sequence is empty', () => {
		// Verify initial state
		expect(sequenceService.isEmpty).toBe(true);
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.state.beats.length).toBe(0);

		// Simulate the reactive derivation logic from RightPanel
		const isSequenceEmpty = sequenceService.isEmpty;

		// Simulate RightPanel conditional logic
		let currentWorkbenchState: any;
		workbenchStore.subscribe((state) => (currentWorkbenchState = state))();

		// RightPanel logic: if activeTab === 'generate' → show ModernGenerationControls
		// else if hasSelectedBeats → show GraphEditor
		// else → show TransitionWrapper (StartPositionPicker/OptionPicker)
		const showGenerationControls = currentWorkbenchState.activeTab === 'generate';
		const hasSelectedBeats = false; // No beats selected in this test
		const showTransitionWrapper = !showGenerationControls && !hasSelectedBeats;

		// Within TransitionWrapper: show StartPositionPicker when empty
		const shouldShowStartPositionPicker = showTransitionWrapper && isSequenceEmpty;
		const shouldShowOptionPicker = showTransitionWrapper && !isSequenceEmpty;

		expect(showGenerationControls).toBe(false); // Should be construct tab
		expect(showTransitionWrapper).toBe(true);
		expect(shouldShowStartPositionPicker).toBe(true);
		expect(shouldShowOptionPicker).toBe(false);

		console.log('✅ UI state correctly determined for empty sequence');
	});

	it('should determine UI state correctly when start position is set', async () => {
		// Get real pictograph data instead of hardcoded mock
		const testStartPosition = await getTestPictographByLetter(Letter.A);
		if (!testStartPosition) {
			throw new Error('Failed to load test pictograph data for Letter A');
		}

		// Verify initial state (empty)
		expect(sequenceService.isEmpty).toBe(true);

		// Set start position to trigger transition
		sequenceService.setStartPosition(testStartPosition);

		// Verify SequenceService state updated
		expect(sequenceService.isEmpty).toBe(false);
		expect(sequenceService.state.startPosition).toEqual(testStartPosition);

		// Simulate the reactive derivation logic from RightPanel
		const isSequenceEmpty = sequenceService.isEmpty;

		// Simulate RightPanel conditional logic
		let currentWorkbenchState: any;
		workbenchStore.subscribe((state) => (currentWorkbenchState = state))();

		const showGenerationControls = currentWorkbenchState.activeTab === 'generate';
		const hasSelectedBeats = false; // No beats selected in this test
		const showTransitionWrapper = !showGenerationControls && !hasSelectedBeats;

		// Within TransitionWrapper: show OptionPicker when not empty
		const shouldShowStartPositionPicker = showTransitionWrapper && isSequenceEmpty;
		const shouldShowOptionPicker = showTransitionWrapper && !isSequenceEmpty;

		expect(showGenerationControls).toBe(false); // Should be construct tab
		expect(showTransitionWrapper).toBe(true);
		expect(shouldShowStartPositionPicker).toBe(false);
		expect(shouldShowOptionPicker).toBe(true);

		console.log('✅ UI state correctly determined when start position is set');
	});

	it('should handle bidirectional transitions correctly', async () => {
		// Get real pictograph data instead of hardcoded mock
		const testStartPosition = await getTestPictographByLetter(Letter.B);
		if (!testStartPosition) {
			throw new Error('Failed to load test pictograph data for Letter B');
		}

		// === STEP 1: Start with empty sequence ===
		expect(sequenceService.isEmpty).toBe(true);
		let isSequenceEmpty = sequenceService.isEmpty;
		expect(isSequenceEmpty).toBe(true); // Should show StartPositionPicker

		// === STEP 2: Set start position ===
		sequenceService.setStartPosition(testStartPosition);
		expect(sequenceService.isEmpty).toBe(false);
		isSequenceEmpty = sequenceService.isEmpty;
		expect(isSequenceEmpty).toBe(false); // Should show OptionPicker

		// === STEP 3: Clear start position ===
		sequenceService.setStartPosition(null);
		expect(sequenceService.isEmpty).toBe(true);
		isSequenceEmpty = sequenceService.isEmpty;
		expect(isSequenceEmpty).toBe(true); // Should show StartPositionPicker again

		console.log('✅ Service handles bidirectional transitions correctly');
	});

	it('should maintain reactive state consistency during rapid changes', async () => {
		// Get multiple real pictograph data entries
		const testPositionC = await getTestPictographByLetter(Letter.C);
		const testPositionD = await getTestPictographByLetter(Letter.D);

		if (!testPositionC || !testPositionD) {
			throw new Error('Failed to load test pictograph data for Letters C and D');
		}

		const testPositions: PictographData[] = [testPositionC, testPositionD];

		// Test rapid state changes
		for (const position of testPositions) {
			// Set position
			sequenceService.setStartPosition(position);
			expect(sequenceService.isEmpty).toBe(false);
			expect(sequenceService.state.startPosition).toEqual(position);

			// Clear position
			sequenceService.setStartPosition(null);
			expect(sequenceService.isEmpty).toBe(true);
			expect(sequenceService.state.startPosition).toBeNull();
		}

		// Final state should be empty
		expect(sequenceService.isEmpty).toBe(true);

		console.log('✅ Service maintains reactive state consistency during rapid changes');
	});
});
