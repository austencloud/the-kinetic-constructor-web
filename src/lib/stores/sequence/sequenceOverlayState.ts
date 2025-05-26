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

function createSequenceOverlayState() {
	let overlayState = $state<SequenceOverlayState>({ ...initialState });

	return {
		// Getter for accessing the current state
		get state() {
			return overlayState;
		},

		// Actions
		openOverlay: (sequenceId?: string) => {
			overlayState = {
				...overlayState,
				isOpen: true,
				selectedSequenceId: sequenceId || null,
				error: null
			};
		},

		closeOverlay: () => {
			overlayState = {
				...overlayState,
				isOpen: false,
				selectedSequenceId: null,
				error: null
			};
		},

		enterFullScreen: () => {
			overlayState = {
				...overlayState,
				isFullScreen: true
			};
		},

		exitFullScreen: () => {
			overlayState = {
				...overlayState,
				isFullScreen: false
			};
		},

		toggleFullScreen: () => {
			overlayState = {
				...overlayState,
				isFullScreen: !overlayState.isFullScreen
			};
		},

		setLoading: (isLoading: boolean) => {
			overlayState = {
				...overlayState,
				isLoading
			};
		},

		setError: (error: string | null) => {
			overlayState = {
				...overlayState,
				error
			};
		},

		setSelectedSequence: (sequenceId: string | null) => {
			overlayState = {
				...overlayState,
				selectedSequenceId: sequenceId
			};
		},

		reset: () => {
			overlayState = { ...initialState };
		}
	};
}

export const sequenceOverlayState = createSequenceOverlayState();

// Convenience exports for common actions
export const {
	openOverlay: openSequenceOverlay,
	closeOverlay: closeSequenceOverlay,
	enterFullScreen: enterSequenceFullScreen,
	exitFullScreen: exitSequenceFullScreen,
	toggleFullScreen: toggleSequenceFullScreen
} = sequenceOverlayState;

// Derived getters for common use cases
export function isSequenceOverlayOpen(): boolean {
	return sequenceOverlayState.state.isOpen;
}

export function isSequenceFullScreen(): boolean {
	return sequenceOverlayState.state.isFullScreen;
}

export function getSelectedSequenceId(): string | null {
	return sequenceOverlayState.state.selectedSequenceId;
}

export function getSequenceOverlayError(): string | null {
	return sequenceOverlayState.state.error;
}

export function isSequenceOverlayLoading(): boolean {
	return sequenceOverlayState.state.isLoading;
}
