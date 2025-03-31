// src/lib/context/sequence/sequenceContext.ts
import { getContext, setContext } from 'svelte';
import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { BeatData } from '$lib/components/SequenceWorkbench/SequenceBeatFrame/BeatData';
import { DIAMOND } from '$lib/types/Constants';

// === State Types ===
export interface SequenceState {
	beats: BeatData[];
	selectedBeatIndex: number;
	startPosition: PictographData | null;
	sequenceName: string;
	difficultyLevel: number;
	status: 'ready' | 'editing' | 'saving' | 'error';
	lastAction: string | null;
}

// === Context Key ===
const SEQUENCE_CONTEXT_KEY = Symbol('sequence-context');

// === Initial State ===
const initialState: SequenceState = {
	beats: [],
	selectedBeatIndex: -1,
	startPosition: null,
	sequenceName: 'Untitled Sequence',
	difficultyLevel: 1,
	status: 'ready',
	lastAction: null
};

// === Action Types ===
export type SequenceAction =
	| { type: 'SELECT_BEAT'; payload: number }
	| { type: 'ADD_BEAT'; payload: BeatData }
	| { type: 'UPDATE_BEAT'; payload: { index: number; data: Partial<BeatData> } }
	| { type: 'REMOVE_BEAT'; payload: number }
	| { type: 'SET_START_POSITION'; payload: PictographData }
	| { type: 'CLEAR_START_POSITION' }
	| { type: 'SET_SEQUENCE_NAME'; payload: string }
	| { type: 'SET_DIFFICULTY'; payload: number }
	| { type: 'CLEAR_SEQUENCE' }
	| { type: 'MIRROR_SEQUENCE'; payload?: { direction: 'horizontal' | 'vertical' } }
	| { type: 'SWAP_COLORS' }
	| { type: 'SET_STATUS'; payload: SequenceState['status'] };

// === Action Creators ===
export const sequenceActions = {
	selectBeat: (index: number): SequenceAction => ({
		type: 'SELECT_BEAT',
		payload: index
	}),

	addBeat: (beat: BeatData): SequenceAction => ({
		type: 'ADD_BEAT',
		payload: beat
	}),

	updateBeat: (index: number, data: Partial<BeatData>): SequenceAction => ({
		type: 'UPDATE_BEAT',
		payload: { index, data }
	}),

	removeBeat: (index: number): SequenceAction => ({
		type: 'REMOVE_BEAT',
		payload: index
	}),

	setStartPosition: (data: PictographData): SequenceAction => ({
		type: 'SET_START_POSITION',
		payload: data
	}),

	clearStartPosition: (): SequenceAction => ({
		type: 'CLEAR_START_POSITION'
	}),

	setSequenceName: (name: string): SequenceAction => ({
		type: 'SET_SEQUENCE_NAME',
		payload: name
	}),

	setDifficulty: (level: number): SequenceAction => ({
		type: 'SET_DIFFICULTY',
		payload: level
	}),

	clearSequence: (): SequenceAction => ({
		type: 'CLEAR_SEQUENCE'
	}),

	mirrorSequence: (direction: 'horizontal' | 'vertical' = 'horizontal'): SequenceAction => ({
		type: 'MIRROR_SEQUENCE',
		payload: { direction }
	}),

	swapColors: (): SequenceAction => ({
		type: 'SWAP_COLORS'
	}),

	setStatus: (status: SequenceState['status']): SequenceAction => ({
		type: 'SET_STATUS',
		payload: status
	})
};

// === Reducer Function ===
function sequenceReducer(state: SequenceState, action: SequenceAction): SequenceState {
	switch (action.type) {
		case 'SELECT_BEAT':
			return {
				...state,
				selectedBeatIndex: action.payload,
				lastAction: action.type
			};

		case 'ADD_BEAT':
			return {
				...state,
				beats: [...state.beats, action.payload],
				lastAction: action.type
			};

		case 'UPDATE_BEAT': {
			const { index, data } = action.payload;
			if (index < 0 || index >= state.beats.length) return state;

			const updatedBeats = [...state.beats];
			updatedBeats[index] = { ...updatedBeats[index], ...data };

			return {
				...state,
				beats: updatedBeats,
				lastAction: action.type
			};
		}

		case 'REMOVE_BEAT':
			return {
				...state,
				beats: state.beats.filter((_, i) => i !== action.payload),
				selectedBeatIndex:
					state.selectedBeatIndex === action.payload ? -1 : state.selectedBeatIndex,
				lastAction: action.type
			};

		case 'SET_START_POSITION':
			return {
				...state,
				startPosition: action.payload,
				lastAction: action.type
			};

		case 'CLEAR_START_POSITION':
			return {
				...state,
				startPosition: null,
				lastAction: action.type
			};

		case 'SET_SEQUENCE_NAME':
			return {
				...state,
				sequenceName: action.payload,
				lastAction: action.type
			};

		case 'SET_DIFFICULTY':
			return {
				...state,
				difficultyLevel: action.payload,
				lastAction: action.type
			};

		case 'CLEAR_SEQUENCE':
			return {
				...state,
				beats: [],
				selectedBeatIndex: -1,
				lastAction: action.type
			};

		case 'MIRROR_SEQUENCE': {
			// This is a placeholder for the actual mirroring logic
			// You would implement the specific transformation based on your data structure
			return {
				...state,
				// Apply mirroring to beats
				lastAction: action.type
			};
		}

		case 'SWAP_COLORS': {
			// This is a placeholder for the actual color swapping logic
			// You would implement the specific transformation based on your data structure
			return {
				...state,
				// Apply color swapping to beats
				lastAction: action.type
			};
		}

		case 'SET_STATUS':
			return {
				...state,
				status: action.payload,
				lastAction: action.type
			};

		default:
			console.warn('Unknown action:', action);
			return state;
	}
}

// === Context Creation ===
export interface SequenceContext {
	state: Readable<SequenceState>;
	dispatch: (action: SequenceAction) => void;
	// Derived state selectors for commonly accessed patterns
	selectedBeat: Readable<BeatData | null>;
	beatCount: Readable<number>;
	isEditing: Readable<boolean>;
}

export function createSequenceContext() {
	// Create the state store
	const state: Writable<SequenceState> = writable(initialState);

	// Dispatch function to update state
	function dispatch(action: SequenceAction) {
		state.update((currentState) => sequenceReducer(currentState, action));
	}

	// Create derived stores for commonly accessed patterns
	const selectedBeat = derived(state, ($state) => {
		const index = $state.selectedBeatIndex;
		return index >= 0 && index < $state.beats.length ? $state.beats[index] : null;
	});

	const beatCount = derived(state, ($state) => $state.beats.length);

	const isEditing = derived(state, ($state) => $state.status === 'editing');

	// Create the context value
	const contextValue: SequenceContext = {
		state,
		dispatch,
		selectedBeat,
		beatCount,
		isEditing
	};

	// Set the context
	setContext(SEQUENCE_CONTEXT_KEY, contextValue);

	return contextValue;
}

// === Context Usage ===
export function getSequenceContext(): SequenceContext {
	return getContext<SequenceContext>(SEQUENCE_CONTEXT_KEY);
}
