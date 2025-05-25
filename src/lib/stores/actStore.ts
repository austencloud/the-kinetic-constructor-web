import { writable } from 'svelte/store';

export interface Act {
	id: string;
	name: string;
	description?: string;
	sequences: string[]; // Array of sequence IDs
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
}

export interface ActState {
	acts: Act[];
	currentActId: string | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: ActState = {
	acts: [],
	currentActId: null,
	isLoading: false,
	error: null
};

function createActStore() {
	const { subscribe, set, update } = writable<ActState>(initialState);

	return {
		subscribe,
		set,
		update,

		// Actions
		createAct: (name: string, description?: string) => {
			const newAct: Act = {
				id: crypto.randomUUID(),
				name,
				description,
				sequences: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true
			};

			update((state) => ({
				...state,
				acts: [...state.acts, newAct]
			}));

			return newAct.id;
		},

		updateAct: (actId: string, updates: Partial<Omit<Act, 'id' | 'createdAt'>>) => {
			update((state) => ({
				...state,
				acts: state.acts.map((act) =>
					act.id === actId ? { ...act, ...updates, updatedAt: new Date() } : act
				)
			}));
		},

		deleteAct: (actId: string) => {
			update((state) => ({
				...state,
				acts: state.acts.filter((act) => act.id !== actId),
				currentActId: state.currentActId === actId ? null : state.currentActId
			}));
		},

		setCurrentAct: (actId: string | null) => {
			update((state) => ({
				...state,
				currentActId: actId
			}));
		},

		addSequenceToAct: (actId: string, sequenceId: string) => {
			update((state) => ({
				...state,
				acts: state.acts.map((act) =>
					act.id === actId
						? {
								...act,
								sequences: [...act.sequences, sequenceId],
								updatedAt: new Date()
							}
						: act
				)
			}));
		},

		removeSequenceFromAct: (actId: string, sequenceId: string) => {
			update((state) => ({
				...state,
				acts: state.acts.map((act) =>
					act.id === actId
						? {
								...act,
								sequences: act.sequences.filter((id) => id !== sequenceId),
								updatedAt: new Date()
							}
						: act
				)
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

		reset: () => {
			set(initialState);
		}
	};
}

export const actStore = createActStore();

// Derived stores for common use cases
export const currentAct = {
	subscribe: (callback: (value: Act | null) => void) => {
		return actStore.subscribe((state) => {
			const current = state.acts.find((act) => act.id === state.currentActId) || null;
			callback(current);
		});
	}
};

export const activeActs = {
	subscribe: (callback: (value: Act[]) => void) => {
		return actStore.subscribe((state) => {
			callback(state.acts.filter((act) => act.isActive));
		});
	}
};

export const isActLoading = {
	subscribe: (callback: (value: boolean) => void) => {
		return actStore.subscribe((state) => callback(state.isLoading));
	}
};
