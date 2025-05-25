import { writable, get } from 'svelte/store';
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

// Create the store with proper typing
const { subscribe, set, update } = writable<ActStoreState>(initialState);

// Export the store with additional methods
export const actStore = {
	subscribe,

	// Initialize the store
	initialize() {
		set({
			act: createEmptyAct(),
			isDirty: false,
			isLoading: false,
			error: null
		});
	},

	// Update the title
	updateTitle(title: string) {
		update((state) => ({
			...state,
			act: { ...state.act, title },
			isDirty: true
		}));
	},

	// Update a beat
	updateBeat(sectionIndex: number, beatIndex: number, beatData: any) {
		update((state) => {
			const newAct = { ...state.act };
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
			return {
				...state,
				act: newAct,
				isDirty: true
			};
		});
	},

	// Update cue and timestamp
	updateCueAndTimestamp(sectionIndex: number, cue: string, timestamp: string) {
		update((state) => {
			const newAct = { ...state.act };
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
			return {
				...state,
				act: newAct,
				isDirty: true
			};
		});
	},

	// Populate from dropped data
	populateFromDroppedData(data: any) {
		update((state) => ({
			...state,
			act: { ...state.act, ...data },
			isDirty: true
		}));
	},

	// Populate from drop (alias for the test)
	populateFromDrop(sequenceData: any, sectionIndex: number, startBeatIndex: number) {
		update((state) => {
			const newAct = { ...state.act };

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

			return {
				...state,
				act: newAct,
				isDirty: true
			};
		});
	},

	// Save to localStorage
	save() {
		const currentState = get({ subscribe });
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('current_act', JSON.stringify(currentState.act));
		}
	},

	// Reset to empty act
	reset() {
		set({
			act: createEmptyAct(),
			isDirty: true,
			isLoading: false,
			error: null
		});
	}
};
