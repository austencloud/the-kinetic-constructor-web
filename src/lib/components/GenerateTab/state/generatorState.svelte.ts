// src/lib/components/GenerateTab/store/generator.svelte.ts
// Svelte 5 runes-based generator store

import { untrack } from 'svelte';

// Generator states
export type GeneratorStatus =
	| 'idle' // Ready to generate
	| 'generating' // Currently generating
	| 'complete' // Generation complete
	| 'error'; // Error occurred

// Generator state interface
interface GeneratorState {
	status: GeneratorStatus;
	progress: number; // 0-100 progress percentage
	message: string; // Status message
	errorMessage: string | null;
	lastGeneratedAt: Date | null;
}

// Initial state
const initialState: GeneratorState = {
	status: 'idle',
	progress: 0,
	message: 'Ready to generate',
	errorMessage: null,
	lastGeneratedAt: null
};

// Create reactive state using Svelte 5 runes
export const generatorState = $state<GeneratorState>(structuredClone(initialState));

// Guard flag to prevent reactive loops
let isProcessing = false;

// Export getter function for components that need to access the state
export function getGeneratorState() {
	return generatorState;
}

// Action functions
export function startGeneration() {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		generatorState.status = 'generating';
		generatorState.progress = 0;
		generatorState.message = 'Starting generation...';
		generatorState.errorMessage = null;
	});
	isProcessing = false;
}

export function updateProgress(progress: number, message: string) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		generatorState.progress = Math.min(100, Math.max(0, progress));
		generatorState.message = message;
	});
	isProcessing = false;
}

export function completeGeneration() {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		generatorState.status = 'complete';
		generatorState.progress = 100;
		generatorState.message = 'Generation complete';
		generatorState.lastGeneratedAt = new Date();
	});
	isProcessing = false;
}

export function setError(errorMessage: string) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		generatorState.status = 'error';
		generatorState.errorMessage = errorMessage;
		generatorState.message = 'Generation failed';
	});
	isProcessing = false;
}

export function reset() {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		generatorState.status = initialState.status;
		generatorState.progress = initialState.progress;
		generatorState.message = initialState.message;
		generatorState.errorMessage = initialState.errorMessage;
		generatorState.lastGeneratedAt = initialState.lastGeneratedAt;
	});
	isProcessing = false;
}

export function updateState(updater: (state: GeneratorState) => GeneratorState) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		const newState = updater(generatorState);
		generatorState.status = newState.status;
		generatorState.progress = newState.progress;
		generatorState.message = newState.message;
		generatorState.errorMessage = newState.errorMessage;
		generatorState.lastGeneratedAt = newState.lastGeneratedAt;
	});
	isProcessing = false;
}

export function setState(newState: GeneratorState) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		generatorState.status = newState.status;
		generatorState.progress = newState.progress;
		generatorState.message = newState.message;
		generatorState.errorMessage = newState.errorMessage;
		generatorState.lastGeneratedAt = newState.lastGeneratedAt;
	});
	isProcessing = false;
}

// Derived state functions (Svelte 5 requirement - cannot export $derived directly)
export function isGenerating() {
	return generatorState.status === 'generating';
}

export function hasError() {
	return generatorState.status === 'error';
}

export function progress() {
	return generatorState.progress;
}

export function statusMessage() {
	return generatorState.message;
}

export function isComplete() {
	return generatorState.status === 'complete';
}

export function isIdle() {
	return generatorState.status === 'idle';
}

export function getErrorMessage() {
	return generatorState.errorMessage;
}

export function getLastGeneratedAt() {
	return generatorState.lastGeneratedAt;
}

// Utility functions
export function canGenerate() {
	return generatorState.status === 'idle' || generatorState.status === 'complete' || generatorState.status === 'error';
}

export function getProgressPercentage() {
	return `${generatorState.progress}%`;
}

export function isInProgress() {
	return generatorState.status === 'generating' && generatorState.progress > 0 && generatorState.progress < 100;
}

// Compatibility layer for old store API
export const generatorStore = {
	// Getter for state access (replaces $generatorStore)
	get state() {
		return generatorState;
	},
	
	// Subscribe method for backward compatibility (though not recommended)
	subscribe: (callback: (state: GeneratorState) => void) => {
		// This is a simplified subscribe for backward compatibility
		// In a real implementation, you'd want to use $effect in the component instead
		callback(generatorState);
		return () => {}; // Unsubscribe function
	},
	
	// Methods
	set: setState,
	update: updateState,
	startGeneration,
	updateProgress,
	completeGeneration,
	setError,
	reset
};

// Export individual derived stores for backward compatibility
export const isGeneratingStore = {
	get value() {
		return generatorState.status === 'generating';
	}
};

export const hasErrorStore = {
	get value() {
		return generatorState.status === 'error';
	}
};

export const progressStore = {
	get value() {
		return generatorState.progress;
	}
};

export const statusMessageStore = {
	get value() {
		return generatorState.message;
	}
};
