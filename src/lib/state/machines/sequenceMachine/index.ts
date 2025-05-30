/**
 * Sequence Machine - Svelte 5 Runes Implementation
 * Provides compatibility layer for sequence state management
 */

import { sequenceState } from '$lib/state/simple/sequenceState.svelte';

/**
 * Sequence actions using simple state management
 */
export const sequenceActions = {
	addBeat: (beat: any) => sequenceState.addBeat(beat),
	removeBeat: (index: number) => sequenceState.removeBeat(index),
	updateBeat: (index: number, beat: any) => sequenceState.updateBeat(index, beat),
	clearSequence: () => sequenceState.clearSequence(),
	selectBeat: (beatId: string) => sequenceState.selectBeat(beatId),
	generate: (generatorType: string, settings: any) => {
		console.log('Generate sequence:', { generatorType, settings });
		// Mock implementation for now
	}
};

/**
 * Sequence selectors using simple state management
 */
export const sequenceSelectors = {
	getBeats: () => sequenceState.beats,
	getBeatCount: () => sequenceState.beatCount,
	getSelectedBeat: () => sequenceState.selectedBeat,
	isEmpty: () => sequenceState.isEmpty,
	isValid: () => sequenceState.isValid
};

/**
 * Sequence machine compatibility
 */
export const sequenceMachine = {
	id: 'sequence',
	getSnapshot() {
		return {
			value: 'idle',
			context: {
				beats: sequenceState.beats,
				selectedBeat: sequenceState.selectedBeat
			}
		};
	}
};
