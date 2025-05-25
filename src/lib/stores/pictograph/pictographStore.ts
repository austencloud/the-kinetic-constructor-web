import { writable } from 'svelte/store';

export interface PictographElement {
	id: string;
	type: 'arrow' | 'prop' | 'glyph';
	position: { x: number; y: number };
	rotation: number;
	color?: string;
	isLoaded: boolean;
	isVisible: boolean;
}

export interface PictographState {
	elements: PictographElement[];
	isLoading: boolean;
	isVisible: boolean;
	error: string | null;
	scale: number;
	position: { x: number; y: number };
	dimensions: { width: number; height: number };
}

const initialState: PictographState = {
	elements: [],
	isLoading: false,
	isVisible: true,
	error: null,
	scale: 1,
	position: { x: 0, y: 0 },
	dimensions: { width: 0, height: 0 }
};

function createPictographStore() {
	const { subscribe, set, update } = writable<PictographState>(initialState);

	return {
		subscribe,
		set,
		update,

		// Actions
		addElement: (element: Omit<PictographElement, 'id'>) => {
			update((state) => ({
				...state,
				elements: [
					...state.elements,
					{
						...element,
						id: crypto.randomUUID()
					}
				]
			}));
		},

		removeElement: (elementId: string) => {
			update((state) => ({
				...state,
				elements: state.elements.filter((el) => el.id !== elementId)
			}));
		},

		updateElement: (elementId: string, updates: Partial<PictographElement>) => {
			update((state) => ({
				...state,
				elements: state.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el))
			}));
		},

		setElements: (elements: PictographElement[]) => {
			update((state) => ({
				...state,
				elements
			}));
		},

		setLoading: (isLoading: boolean) => {
			update((state) => ({
				...state,
				isLoading
			}));
		},

		setVisible: (isVisible: boolean) => {
			update((state) => ({
				...state,
				isVisible
			}));
		},

		setError: (error: string | null) => {
			update((state) => ({
				...state,
				error
			}));
		},

		setScale: (scale: number) => {
			update((state) => ({
				...state,
				scale: Math.max(0.1, Math.min(5, scale)) // Clamp between 0.1 and 5
			}));
		},

		setPosition: (position: { x: number; y: number }) => {
			update((state) => ({
				...state,
				position
			}));
		},

		setDimensions: (dimensions: { width: number; height: number }) => {
			update((state) => ({
				...state,
				dimensions
			}));
		},

		clearElements: () => {
			update((state) => ({
				...state,
				elements: []
			}));
		},

		reset: () => {
			set(initialState);
		}
	};
}

export const pictographStore = createPictographStore();

// Derived stores for common use cases
export const pictographElements = {
	subscribe: (callback: (value: PictographElement[]) => void) => {
		return pictographStore.subscribe((state) => callback(state.elements));
	}
};

export const isPictographLoading = {
	subscribe: (callback: (value: boolean) => void) => {
		return pictographStore.subscribe((state) => callback(state.isLoading));
	}
};

export const isPictographVisible = {
	subscribe: (callback: (value: boolean) => void) => {
		return pictographStore.subscribe((state) => callback(state.isVisible));
	}
};
