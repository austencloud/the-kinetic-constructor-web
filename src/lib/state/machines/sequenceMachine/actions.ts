/**
 * Modern actions for the sequence state machine
 *
 * This module provides actions that interact with the modern sequence container
 * instead of the legacy sequence store.
 */

import { sequenceContainer } from '../../stores/sequence/SequenceContainer';
import type { BeatData } from '../../stores/sequence/SequenceContainer';
import { convertToStoreBeatData } from './types';
import { updateDevTools } from '$lib/utils/devToolsUpdater';
import { isSequenceEmpty } from './persistence';

/**
 * Update the word name in the sequence metadata based on the current beats
 */
function updateSequenceWord() {
	const state = sequenceContainer.state;
	const beats = state.beats;

	// Update difficulty based on whether beats exist
	const difficulty = beats.length > 0 ? 1 : 0;

	// Extract letters from beats and combine into a word
	const letters = beats
		.map((beat) => {
			// Look for letter data according to the BeatData interface
			return (
				beat.letter ||
				(beat.metadata && typeof beat.metadata.letter === 'string' ? beat.metadata.letter : null)
			);
		})
		.filter((letter): letter is string => letter !== null);

	// Build the word from letters
	const word = letters.join('');

	// Update metadata with word and difficulty
	sequenceContainer.updateMetadata({
		name: word,
		difficulty: difficulty
	});

	updateDevTools();
}

/**
 * Update the sequence container with the generated sequence
 */
export function updateSequence({ event }: { event: any }) {
	// Type assertion for the custom event
	const doneEvent = event as { type: 'GENERATION_COMPLETE'; output?: any[] };

	// Update the sequence container with the generated beats
	if (doneEvent.output && Array.isArray(doneEvent.output)) {
		// Convert the output to the container's BeatData format
		const storeBeats = convertToStoreBeatData(doneEvent.output);
		sequenceContainer.setSequence(storeBeats);
		console.log('Sequence updated with new data:', storeBeats);

		// Update the sequence word
		updateSequenceWord();

		// Update dev tools with the new sequence state
		updateDevTools();
	}
}

/**
 * Select a beat in the sequence
 */
export function selectBeat({ event }: { event: any }) {
	const selectEvent = event as { type: 'SELECT_BEAT'; beatId: string };
	sequenceContainer.selectBeat(selectEvent.beatId);

	// Dispatch a custom event for components that need to know about selection changes
	if (typeof document !== 'undefined') {
		const selectionEvent = new CustomEvent('beat-selected', {
			detail: { beatId: selectEvent.beatId },
			bubbles: true
		});
		document.dispatchEvent(selectionEvent);

		// Update dev tools
		updateDevTools();
	}
}

/**
 * Deselect a beat in the sequence
 */
export function deselectBeat({ event }: { event: any }) {
	const deselectEvent = event as { type: 'DESELECT_BEAT'; beatId: string };
	sequenceContainer.deselectBeat(deselectEvent.beatId);

	// Dispatch a custom event
	if (typeof document !== 'undefined') {
		const selectionEvent = new CustomEvent('beat-deselected', {
			detail: { beatId: deselectEvent.beatId },
			bubbles: true
		});
		document.dispatchEvent(selectionEvent);

		// Update dev tools
		updateDevTools();
	}
}

/**
 * Add a beat to the sequence
 */
export function addBeat({ event }: { event: any }) {
	const addEvent = event as { type: 'ADD_BEAT'; beat: Partial<BeatData> };

	// Generate a unique ID if not provided
	const beatId = addEvent.beat.id || crypto.randomUUID();

	// Create a complete beat object
	const newBeat: BeatData = {
		id: beatId,
		number: addEvent.beat.number || 0,
		...addEvent.beat
	};

	// Add the beat to the sequence container
	sequenceContainer.addBeat(newBeat);

	// Update the sequence word
	updateSequenceWord();

	// Dispatch a custom event
	if (typeof document !== 'undefined') {
		const beatEvent = new CustomEvent('beat-added', {
			detail: { beat: newBeat },
			bubbles: true
		});
		document.dispatchEvent(beatEvent);

		// Update dev tools
		updateDevTools();
	}
}

/**
 * Remove a beat from the sequence
 */
export function removeBeat({ event }: { event: any }) {
	const removeEvent = event as { type: 'REMOVE_BEAT'; beatId: string };
	sequenceContainer.removeBeat(removeEvent.beatId);

	// Update the sequence word
	updateSequenceWord();

	// Dispatch a custom event
	if (typeof document !== 'undefined') {
		const beatEvent = new CustomEvent('beat-removed', {
			detail: { beatId: removeEvent.beatId },
			bubbles: true
		});
		document.dispatchEvent(beatEvent);

		// Update dev tools
		updateDevTools();
	}
}

/**
 * Remove a beat and all following beats from the sequence
 */
export function removeBeatAndFollowing({ event }: { event: any }) {
	const removeEvent = event as { type: 'REMOVE_BEAT_AND_FOLLOWING'; beatId: string };

	// Find the beat index
	const beatIndex = sequenceContainer.state.beats.findIndex(
		(beat) => beat.id === removeEvent.beatId
	);

	if (beatIndex >= 0) {
		// Get all beats that should be removed (the selected beat and all following beats)
		const beatsToRemove = sequenceContainer.state.beats.slice(beatIndex).map((beat) => beat.id);

		// Remove each beat
		beatsToRemove.forEach((id) => {
			sequenceContainer.removeBeat(id);
		});

		// Update the sequence word
		updateSequenceWord();

		// Dispatch a custom event
		if (typeof document !== 'undefined') {
			const sequenceUpdatedEvent = new CustomEvent('sequence-updated', {
				detail: { type: 'beats-removed', fromIndex: beatIndex },
				bubbles: true
			});
			document.dispatchEvent(sequenceUpdatedEvent);

			// Update dev tools
			updateDevTools();
		}
	}
}

/**
 * Update a beat in the sequence
 */
export function updateBeat({ event }: { event: any }) {
	const updateEvent = event as {
		type: 'UPDATE_BEAT';
		beatId: string;
		updates: Partial<BeatData>;
	};
	sequenceContainer.updateBeat(updateEvent.beatId, updateEvent.updates);

	// Update the sequence word
	updateSequenceWord();

	// Dispatch a custom event
	if (typeof document !== 'undefined') {
		const beatEvent = new CustomEvent('beat-updated', {
			detail: { beatId: updateEvent.beatId, updates: updateEvent.updates },
			bubbles: true
		});
		document.dispatchEvent(beatEvent);

		// Update dev tools
		updateDevTools();
	}
}

/**
 * Clear the entire sequence
 */
export function clearSequence() {
	// Set an empty sequence
	sequenceContainer.setSequence([]);

	// Update the sequence word
	updateSequenceWord();

	// Ensure isSequenceEmpty is set to true
	// This is a backup in case the subscription in persistence.ts doesn't trigger
	isSequenceEmpty.set(true);

	// Dispatch a custom event
	if (typeof document !== 'undefined') {
		const sequenceUpdatedEvent = new CustomEvent('sequence-updated', {
			detail: { type: 'sequence-cleared' },
			bubbles: true
		});
		document.dispatchEvent(sequenceUpdatedEvent);

		// Update dev tools
		updateDevTools();
	}
}
