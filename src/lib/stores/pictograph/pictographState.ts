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

function createPictographState() {
	let pictographState = $state<PictographState>({ ...initialState });

	return {
		// Getter for accessing the current state
		get state() {
			return pictographState;
		},

		// Actions
		addElement: (element: Omit<PictographElement, 'id'>) => {
			pictographState = {
				...pictographState,
				elements: [
					...pictographState.elements,
					{
						...element,
						id: crypto.randomUUID()
					}
				]
			};
		},

		removeElement: (elementId: string) => {
			pictographState = {
				...pictographState,
				elements: pictographState.elements.filter((el) => el.id !== elementId)
			};
		},

		updateElement: (elementId: string, updates: Partial<PictographElement>) => {
			pictographState = {
				...pictographState,
				elements: pictographState.elements.map((el) =>
					el.id === elementId ? { ...el, ...updates } : el
				)
			};
		},

		setElements: (elements: PictographElement[]) => {
			pictographState = {
				...pictographState,
				elements
			};
		},

		setLoading: (isLoading: boolean) => {
			pictographState = {
				...pictographState,
				isLoading
			};
		},

		setVisible: (isVisible: boolean) => {
			pictographState = {
				...pictographState,
				isVisible
			};
		},

		setError: (error: string | null) => {
			pictographState = {
				...pictographState,
				error
			};
		},

		setScale: (scale: number) => {
			pictographState = {
				...pictographState,
				scale: Math.max(0.1, Math.min(5, scale)) // Clamp between 0.1 and 5
			};
		},

		setPosition: (position: { x: number; y: number }) => {
			pictographState = {
				...pictographState,
				position
			};
		},

		setDimensions: (dimensions: { width: number; height: number }) => {
			pictographState = {
				...pictographState,
				dimensions
			};
		},

		clearElements: () => {
			pictographState = {
				...pictographState,
				elements: []
			};
		},

		reset: () => {
			pictographState = { ...initialState };
		}
	};
}

export const pictographState = createPictographState();

// Derived getters for common use cases
export function getPictographElements(): PictographElement[] {
	return pictographState.state.elements;
}

export function isPictographLoading(): boolean {
	return pictographState.state.isLoading;
}

export function isPictographVisible(): boolean {
	return pictographState.state.isVisible;
}

export function getPictographError(): string | null {
	return pictographState.state.error;
}

export function getPictographScale(): number {
	return pictographState.state.scale;
}

export function getPictographPosition(): { x: number; y: number } {
	return pictographState.state.position;
}

export function getPictographDimensions(): { width: number; height: number } {
	return pictographState.state.dimensions;
}

// For backward compatibility, export the main store as default
export default pictographState;
