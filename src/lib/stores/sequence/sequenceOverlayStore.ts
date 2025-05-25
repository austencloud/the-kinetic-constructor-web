import { writable } from 'svelte/store';

export interface SequenceOverlayState {
	isOpen: boolean;
	isFullScreen: boolean;
	selectedSequenceId: string | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: SequenceOverlayState = {
	isOpen: false,
	isFullScreen: false,
	selectedSequenceId: null,
	isLoading: false,
	error: null
};

function createSequenceOverlayStore() {
	const { subscribe, set, update } = writable<SequenceOverlayState>(initialState);

	return {
		subscribe,
		set,
		update,

		// Actions
		openOverlay: (sequenceId?: string) => {
			update((state) => ({
				...state,
				isOpen: true,
				selectedSequenceId: sequenceId || null,
				error: null
			}));
		},

		closeOverlay: () => {
			update((state) => ({
				...state,
				isOpen: false,
				selectedSequenceId: null,
				error: null
			}));
		},

		enterFullScreen: () => {
			update((state) => ({
				...state,
				isFullScreen: true
			}));
		},

		exitFullScreen: () => {
			update((state) => ({
				...state,
				isFullScreen: false
			}));
		},

		toggleFullScreen: () => {
			update((state) => ({
				...state,
				isFullScreen: !state.isFullScreen
			}));
		},

		setLoading: (isLoading: boolean) => {
			update((state) => ({
				...state,
				isLoading
			}));
		},

		setError: (error: string | null) => {
			update((state) => ({
				...state,
				error
			}));
		},

		setSelectedSequence: (sequenceId: string | null) => {
			update((state) => ({
				...state,
				selectedSequenceId: sequenceId
			}));
		},

		reset: () => {
			set(initialState);
		}
	};
}

export const sequenceOverlayStore = createSequenceOverlayStore();

// Convenience exports for common actions
export const {
	openOverlay: openSequenceOverlay,
	closeOverlay: closeSequenceOverlay,
	enterFullScreen: enterSequenceFullScreen,
	exitFullScreen: exitSequenceFullScreen,
	toggleFullScreen: toggleSequenceFullScreen
} = sequenceOverlayStore;

// Derived stores for common use cases
export const isSequenceOverlayOpen = {
	subscribe: (callback: (value: boolean) => void) => {
		return sequenceOverlayStore.subscribe((state) => callback(state.isOpen));
	}
};

export const isSequenceFullScreen = {
	subscribe: (callback: (value: boolean) => void) => {
		return sequenceOverlayStore.subscribe((state) => callback(state.isFullScreen));
	}
};

export const selectedSequenceId = {
	subscribe: (callback: (value: string | null) => void) => {
		return sequenceOverlayStore.subscribe((state) => callback(state.selectedSequenceId));
	}
};
