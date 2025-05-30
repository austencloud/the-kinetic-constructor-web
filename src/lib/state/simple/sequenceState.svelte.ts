/**
 * Simple Sequence State - Pure Svelte 5 Runes
 * Replaces the XState sequence machine with simple reactive state
 */

import type { Beat } from '$lib/types/Beat';

// Sequence state using pure Svelte 5 runes
export const sequenceState = (() => {
	// State using $state runes
	let sequence = $state<Beat[]>([]);
	let selectedBeatIds = $state<string[]>([]);
	let currentBeatIndex = $state(0);
	let isGenerating = $state(false);
	let generationProgress = $state(0);
	let generationMessage = $state('');
	let error = $state<string | null>(null);
	let isModified = $state(false);
	let isPlaying = $state(false);
	let playbackPosition = $state(0);

	// Metadata
	let metadata = $state({
		name: 'Untitled Sequence',
		difficulty: 1,
		tags: [] as string[],
		description: '',
		author: '',
		createdAt: new Date(),
		updatedAt: new Date()
	});

	// Actions
	const actions = {
		// Beat management
		addBeat(beat: Beat) {
			sequence = [...sequence, beat];
			isModified = true;
			metadata.updatedAt = new Date();
		},

		removeBeat(index: number) {
			if (index >= 0 && index < sequence.length) {
				sequence = sequence.filter((_, i) => i !== index);
				isModified = true;
				metadata.updatedAt = new Date();
			}
		},

		updateBeat(index: number, beat: Beat) {
			if (index >= 0 && index < sequence.length) {
				sequence = sequence.map((b, i) => i === index ? beat : b);
				isModified = true;
				metadata.updatedAt = new Date();
			}
		},

		clearSequence() {
			sequence = [];
			selectedBeatIds = [];
			currentBeatIndex = 0;
			isModified = true;
			metadata.updatedAt = new Date();
		},

		// Selection management
		selectBeat(beatId: string) {
			if (!selectedBeatIds.includes(beatId)) {
				selectedBeatIds = [...selectedBeatIds, beatId];
			}
		},

		deselectBeat(beatId: string) {
			selectedBeatIds = selectedBeatIds.filter(id => id !== beatId);
		},

		clearSelection() {
			selectedBeatIds = [];
		},

		selectMultipleBeats(beatIds: string[]) {
			selectedBeatIds = [...new Set([...selectedBeatIds, ...beatIds])];
		},

		// Navigation
		setCurrentBeatIndex(index: number) {
			if (index >= 0 && index < sequence.length) {
				currentBeatIndex = index;
			}
		},

		nextBeat() {
			if (currentBeatIndex < sequence.length - 1) {
				currentBeatIndex++;
			}
		},

		previousBeat() {
			if (currentBeatIndex > 0) {
				currentBeatIndex--;
			}
		},

		// Generation
		startGeneration(options: any) {
			isGenerating = true;
			generationProgress = 0;
			generationMessage = 'Starting generation...';
			error = null;
		},

		updateGenerationProgress(progress: number, message: string) {
			generationProgress = progress;
			generationMessage = message;
		},

		completeGeneration(newSequence: Beat[]) {
			sequence = newSequence;
			isGenerating = false;
			generationProgress = 100;
			generationMessage = 'Generation complete!';
			isModified = true;
			metadata.updatedAt = new Date();
		},

		failGeneration(errorMessage: string) {
			isGenerating = false;
			error = errorMessage;
			generationProgress = 0;
			generationMessage = '';
		},

		// Playback
		startPlayback() {
			isPlaying = true;
			playbackPosition = 0;
		},

		stopPlayback() {
			isPlaying = false;
			playbackPosition = 0;
		},

		pausePlayback() {
			isPlaying = false;
		},

		setPlaybackPosition(position: number) {
			playbackPosition = Math.max(0, Math.min(position, sequence.length - 1));
		},

		// Metadata
		updateMetadata(updates: Partial<typeof metadata>) {
			metadata = { ...metadata, ...updates, updatedAt: new Date() };
			isModified = true;
		},

		// State management
		markSaved() {
			isModified = false;
		},

		reset() {
			sequence = [];
			selectedBeatIds = [];
			currentBeatIndex = 0;
			isGenerating = false;
			generationProgress = 0;
			generationMessage = '';
			error = null;
			isModified = false;
			isPlaying = false;
			playbackPosition = 0;
			metadata = {
				name: 'Untitled Sequence',
				difficulty: 1,
				tags: [],
				description: '',
				author: '',
				createdAt: new Date(),
				updatedAt: new Date()
			};
		}
	};

	// Getters (derived state)
	const getters = {
		get sequence() { return sequence; },
		get selectedBeatIds() { return selectedBeatIds; },
		get currentBeatIndex() { return currentBeatIndex; },
		get isGenerating() { return isGenerating; },
		get generationProgress() { return generationProgress; },
		get generationMessage() { return generationMessage; },
		get error() { return error; },
		get isModified() { return isModified; },
		get isPlaying() { return isPlaying; },
		get playbackPosition() { return playbackPosition; },
		get metadata() { return metadata; },
		
		// Derived values
		get selectedBeats() { 
			return sequence.filter(beat => selectedBeatIds.includes(beat.id)); 
		},
		get currentBeat() { 
			return sequence[currentBeatIndex] || null; 
		},
		get beatCount() { 
			return sequence.length; 
		},
		get hasSelection() { 
			return selectedBeatIds.length > 0; 
		},
		get canPlay() { 
			return sequence.length > 0; 
		},
		get isEmpty() { 
			return sequence.length === 0; 
		},
		get sequenceDuration() { 
			return sequence.reduce((total, beat) => total + (beat.duration || 1), 0); 
		}
	};

	return {
		...getters,
		...actions
	};
})();

// Export individual pieces for convenience
export const {
	// Getters
	sequence,
	selectedBeatIds,
	currentBeatIndex,
	isGenerating,
	generationProgress,
	generationMessage,
	error,
	isModified,
	isPlaying,
	playbackPosition,
	metadata,
	selectedBeats,
	currentBeat,
	beatCount,
	hasSelection,
	canPlay,
	isEmpty,
	sequenceDuration,
	// Actions
	addBeat,
	removeBeat,
	updateBeat,
	clearSequence,
	selectBeat,
	deselectBeat,
	clearSelection,
	selectMultipleBeats,
	setCurrentBeatIndex,
	nextBeat,
	previousBeat,
	startGeneration,
	updateGenerationProgress,
	completeGeneration,
	failGeneration,
	startPlayback,
	stopPlayback,
	pausePlayback,
	setPlaybackPosition,
	updateMetadata,
	markSaved,
	reset
} = sequenceState;
