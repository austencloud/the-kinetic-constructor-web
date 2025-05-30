import type { Act } from '../models/Act';
import { createEmptyAct } from '../models/Act';

// Define the store state interface
interface ActStoreState {
	act: Act;
	isDirty: boolean;
	isLoading: boolean;
	error: string | null;
}

// Create initial state
const initialState: ActStoreState = {
	act: createEmptyAct(),
	isDirty: false,
	isLoading: false,
	error: null
};

// Create reactive state with Svelte 5 runes
let internalState = $state<ActStoreState>({ ...initialState });

// Export the state with additional methods
export const actState = {
	// Getter for state access
	get state() {
		return internalState;
	},

	// Initialize the store
	initialize() {
		internalState = {
			act: createEmptyAct(),
			isDirty: false,
			isLoading: false,
			error: null
		};
	},

	// Update the title
	updateTitle(title: string) {
		internalState = {
			...internalState,
			act: { ...internalState.act, title },
			isDirty: true
		};
	},

	// Update a beat
	updateBeat(sectionIndex: number, beatIndex: number, beatData: any) {
		const newAct = { ...internalState.act };
		if (!newAct.sequences[sectionIndex]) {
			newAct.sequences[sectionIndex] = {
				sequence_start_marker: false,
				cue: '',
				timestamp: '',
				beats: []
			};
		}
		if (!newAct.sequences[sectionIndex].beats[beatIndex]) {
			newAct.sequences[sectionIndex].beats[beatIndex] = {
				step_label: '',
				is_filled: false
			};
		}
		newAct.sequences[sectionIndex].beats[beatIndex] = {
			...newAct.sequences[sectionIndex].beats[beatIndex],
			...beatData
		};
		internalState = {
			...internalState,
			act: newAct,
			isDirty: true
		};
	},

	// Update cue and timestamp
	updateCueAndTimestamp(sectionIndex: number, cue: string, timestamp: string) {
		const newAct = { ...internalState.act };
		if (!newAct.sequences[sectionIndex]) {
			newAct.sequences[sectionIndex] = {
				sequence_start_marker: false,
				cue: '',
				timestamp: '',
				beats: []
			};
		}
		newAct.sequences[sectionIndex].cue = cue;
		newAct.sequences[sectionIndex].timestamp = timestamp;
		internalState.act = newAct;
		internalState.isDirty = true;
	},

	// Populate from dropped data
	populateFromDroppedData(data: any) {
		internalState.act = { ...internalState.act, ...data };
		internalState.isDirty = true;
	},

	// Populate from drop (alias for the test)
	populateFromDrop(sequenceData: any, sectionIndex: number, startBeatIndex: number) {
		const newAct = { ...internalState.act };

		// Ensure the section exists
		if (!newAct.sequences[sectionIndex]) {
			newAct.sequences[sectionIndex] = {
				sequence_start_marker: false,
				cue: '',
				timestamp: '',
				beats: []
			};
		}

		// Populate beats from the sequence data
		if (sequenceData.beats) {
			sequenceData.beats.forEach((beat: any, index: number) => {
				const beatIndex = startBeatIndex + index;
				if (!newAct.sequences[sectionIndex].beats[beatIndex]) {
					newAct.sequences[sectionIndex].beats[beatIndex] = {
						step_label: '',
						is_filled: false
					};
				}
				newAct.sequences[sectionIndex].beats[beatIndex] = {
					...newAct.sequences[sectionIndex].beats[beatIndex],
					...beat,
					is_filled: true
				};
			});
		}

		internalState.act = newAct;
		internalState.isDirty = true;
	},

	// Save to localStorage
	save() {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('current_act', JSON.stringify(internalState.act));
		}
	},

	// Reset to empty act
	reset() {
		internalState.act = createEmptyAct();
		internalState.isDirty = true;
		internalState.isLoading = false;
		internalState.error = null;
	}
};
