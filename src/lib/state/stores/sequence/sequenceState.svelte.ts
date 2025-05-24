/**
 * Sequence State Management with Svelte 5 Runes
 *
 * Modern replacement for sequenceAdapter.ts using pure Svelte 5 runes
 */

import { browser } from '$app/environment';

export interface BeatData {
	id: string;
	number: number;
	letter?: string;
	position?: string;
	orientation?: string;
	turnsTuple?: string;
	redPropData?: any;
	bluePropData?: any;
	redArrowData?: any;
	blueArrowData?: any;
	redMotionData?: any;
	blueMotionData?: any;
	metadata?: Record<string, unknown>;
	pictographData?: any;
}

export interface SequenceMetadata {
	name: string;
	difficulty: number;
	tags: string[];
	createdAt: Date;
	lastModified: Date;
}

// Create individual state variables using Svelte 5 runes
export let beats = $state<BeatData[]>([]);
export let selectedBeatIds = $state<string[]>([]);
export let currentBeatIndex = $state(0);
export let isModified = $state(false);
export let metadata = $state<SequenceMetadata>({
	name: '',
	difficulty: 0,
	tags: [],
	createdAt: new Date(),
	lastModified: new Date()
});

// Auto-save functionality
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
	if (isModified && browser) {
		if (saveTimeout) clearTimeout(saveTimeout);

		saveTimeout = setTimeout(() => {
			sequenceActions.saveToLocalStorage();
			saveTimeout = null;
		}, 500);
	}
});

// Action functions for sequence management
export const sequenceActions = {
	/**
	 * Add a single beat to the sequence
	 */
	addBeat(beat: BeatData) {
		beats.push(beat);
		isModified = true;
		metadata.lastModified = new Date();
	},

	/**
	 * Add multiple beats to the sequence
	 */
	addBeats(newBeats: BeatData[]) {
		beats.push(...newBeats);
		isModified = true;
		metadata.lastModified = new Date();
	},

	/**
	 * Set the entire sequence
	 */
	setSequence(newBeats: BeatData[]) {
		beats = newBeats;
		isModified = true;
		currentBeatIndex = 0;
		selectedBeatIds = [];
		metadata.lastModified = new Date();
	},

	/**
	 * Remove a beat by ID
	 */
	removeBeat(beatId: string) {
		beats = beats.filter((beat) => beat.id !== beatId);
		selectedBeatIds = selectedBeatIds.filter((id) => id !== beatId);
		isModified = true;
		metadata.lastModified = new Date();
	},

	/**
	 * Update a beat by ID
	 */
	updateBeat(beatId: string, updates: Partial<BeatData>) {
		const beatIndex = beats.findIndex((beat) => beat.id === beatId);
		if (beatIndex >= 0) {
			Object.assign(beats[beatIndex], updates);
			isModified = true;
			metadata.lastModified = new Date();
		}
	},

	/**
	 * Select a beat (with optional multi-select)
	 */
	selectBeat(beatId: string, multiSelect = false) {
		if (multiSelect) {
			// Toggle selection
			if (selectedBeatIds.includes(beatId)) {
				selectedBeatIds = selectedBeatIds.filter((id) => id !== beatId);
			} else {
				selectedBeatIds.push(beatId);
			}
		} else {
			// Replace selection
			selectedBeatIds = [beatId];
		}
	},

	/**
	 * Deselect a beat
	 */
	deselectBeat(beatId: string) {
		selectedBeatIds = selectedBeatIds.filter((id) => id !== beatId);
	},

	/**
	 * Clear all selections
	 */
	clearSelection() {
		selectedBeatIds = [];
	},

	/**
	 * Set the current beat index
	 */
	setCurrentBeatIndex(index: number) {
		currentBeatIndex = Math.max(0, Math.min(index, beats.length - 1));
	},

	/**
	 * Update sequence metadata
	 */
	updateMetadata(updates: Partial<SequenceMetadata>) {
		Object.assign(metadata, updates, { lastModified: new Date() });
		isModified = true;
	},

	/**
	 * Mark the sequence as saved
	 */
	markAsSaved() {
		isModified = false;
	},

	/**
	 * Save sequence to localStorage
	 */
	async saveToLocalStorage() {
		if (!browser) return;

		try {
			// Create safe copies of beats for storage
			const safeBeats = beats.map((beat) => {
				const safeBeat = { ...beat };

				// Ensure pictographData is properly structured
				if (!safeBeat.pictographData && beat.metadata) {
					safeBeat.pictographData = {
						letter: beat.letter || beat.metadata.letter || null,
						startPos: beat.position || beat.metadata.startPos || null,
						endPos: beat.metadata.endPos || null,
						gridMode: beat.metadata.gridMode || 'diamond',
						redPropData: beat.redPropData || null,
						bluePropData: beat.bluePropData || null,
						redMotionData: beat.redMotionData || null,
						blueMotionData: beat.blueMotionData || null,
						redArrowData: beat.redArrowData || null,
						blueArrowData: beat.blueArrowData || null,
						grid: beat.metadata.grid || '',
						timing: null,
						direction: null,
						gridData: null,
						motions: [],
						redMotion: null,
						blueMotion: null,
						props: []
					};
				}

				return safeBeat;
			});

			// Update sequence name from letters
			const letters = beats
				.map((beat) => beat.letter || (beat.metadata?.letter as string) || null)
				.filter((letter): letter is string => letter !== null);

			metadata.name = letters.join('');

			const sequenceData = {
				beats: safeBeats,
				selectedBeatIds,
				currentBeatIndex,
				isModified,
				metadata: {
					...metadata,
					createdAt: metadata.createdAt.toISOString(),
					lastModified: metadata.lastModified.toISOString()
				}
			};

			localStorage.setItem('sequence', JSON.stringify(sequenceData));
			isModified = false;
		} catch (error) {
			console.error('Failed to save sequence to localStorage:', error);
		}
	},

	/**
	 * Load sequence from localStorage
	 */
	async loadFromLocalStorage(): Promise<boolean> {
		if (!browser) return false;

		try {
			const savedSequence = localStorage.getItem('sequence');
			if (!savedSequence) return false;

			const parsed = JSON.parse(savedSequence);

			if (parsed.beats && Array.isArray(parsed.beats)) {
				// Restore beats with proper structure
				beats = parsed.beats.map((beat: any) => ({
					id: beat.id || `beat-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
					number: beat.number || 0,
					letter: beat.letter || beat.metadata?.letter || null,
					position: beat.position || beat.metadata?.startPos || null,
					orientation: beat.orientation || '',
					turnsTuple: beat.turnsTuple || '',
					redPropData: beat.redPropData || beat.pictographData?.redPropData || null,
					bluePropData: beat.bluePropData || beat.pictographData?.bluePropData || null,
					redArrowData: beat.redArrowData || beat.pictographData?.redArrowData || null,
					blueArrowData: beat.blueArrowData || beat.pictographData?.blueArrowData || null,
					redMotionData: beat.redMotionData || beat.pictographData?.redMotionData || null,
					blueMotionData: beat.blueMotionData || beat.pictographData?.blueMotionData || null,
					metadata: beat.metadata || {},
					pictographData: beat.pictographData || null
				}));

				selectedBeatIds = parsed.selectedBeatIds || [];
				currentBeatIndex = parsed.currentBeatIndex || 0;
				isModified = parsed.isModified || false;

				// Restore metadata with proper date objects
				if (parsed.metadata) {
					metadata = {
						...parsed.metadata,
						createdAt: new Date(parsed.metadata.createdAt),
						lastModified: new Date(parsed.metadata.lastModified)
					};
				}

				// Update sequence name from letters
				const letters = beats
					.map((beat) => beat.letter || (beat.metadata?.letter as string) || null)
					.filter((letter): letter is string => letter !== null);

				metadata.name = letters.join('');
			}

			return true;
		} catch (error) {
			console.error('Failed to load sequence from localStorage:', error);
			return false;
		}
	},

	/**
	 * Reset sequence to empty state
	 */
	reset() {
		beats = [];
		selectedBeatIds = [];
		currentBeatIndex = 0;
		isModified = false;
		metadata = {
			name: '',
			difficulty: 0,
			tags: [],
			createdAt: new Date(),
			lastModified: new Date()
		};
	}
};

// Derived state functions for convenience
export function selectedBeats() {
	return beats.filter((beat) => selectedBeatIds.includes(beat.id));
}

export function currentBeat() {
	return beats[currentBeatIndex] || null;
}

export function beatCount() {
	return beats.length;
}

export function sequenceDifficulty() {
	return metadata.difficulty;
}

export function sequenceName() {
	return metadata.name;
}

export function hasSelection() {
	return selectedBeatIds.length > 0;
}

export function isSequenceEmpty() {
	return beats.length === 0;
}

// Backward compatibility exports
export { beats as sequenceStore };
export { selectedBeats as selectedBeatsStore };
export { currentBeat as currentBeatStore };
export { beatCount as beatCountStore };
export { sequenceDifficulty as sequenceDifficultyStore };
