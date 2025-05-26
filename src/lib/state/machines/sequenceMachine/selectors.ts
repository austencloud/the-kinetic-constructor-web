/**
 * Selectors for the sequence state machine
 */
import type { BeatData as StoreBeatData } from '../../stores/sequence/SequenceContainer.svelte';
import { sequenceContainer } from '../../stores/sequence/SequenceContainer.svelte';
import type { Actor } from 'xstate';

/**
 * Helper functions to get current state from the sequence machine
 */
export function createSequenceSelectors(sequenceActor: Actor<any>) {
	return {
		// Generation selectors
		isGenerating: () => {
			return sequenceActor.getSnapshot().matches('generating');
		},

		hasError: () => {
			return sequenceActor.getSnapshot().matches('error');
		},

		error: () => {
			return sequenceActor.getSnapshot().context.error;
		},

		progress: () => {
			return sequenceActor.getSnapshot().context.generationProgress;
		},

		message: () => {
			return sequenceActor.getSnapshot().context.generationMessage;
		},

		generationMessage: () => {
			return sequenceActor.getSnapshot().context.generationMessage;
		},

		generationType: () => {
			return sequenceActor.getSnapshot().context.generationType;
		},

		generationOptions: () => {
			return sequenceActor.getSnapshot().context.generationOptions;
		},

		// Beat selectors (using sequenceStore)
		selectedBeatIds: () => {
			// Use the modern container - NO STORES!
			return sequenceContainer.state.selectedBeatIds;
		},

		selectedBeats: () => {
			// Use the modern container - NO STORES!
			const state = sequenceContainer.state;
			return state.beats.filter((beat) => state.selectedBeatIds.includes(beat.id));
		},

		currentBeatIndex: () => {
			// Use the modern container - NO STORES!
			return sequenceContainer.state.currentBeatIndex;
		},

		beats: () => {
			// Use the modern container - NO STORES!
			return sequenceContainer.state.beats;
		},

		beatCount: () => {
			// Use the modern container - NO STORES!
			return sequenceContainer.state.beats.length;
		}
	};
}
