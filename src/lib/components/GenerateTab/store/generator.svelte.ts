/**
 * Generator Store - Svelte 5 Runes Implementation
 */

interface GeneratorState {
	isGenerating: boolean;
	hasError: boolean;
	statusMessage: string;
}

function createGeneratorStore() {
	let isGenerating = $state(false);
	let hasError = $state(false);
	let statusMessage = $state('Ready to generate');

	return {
		get isGenerating() { return isGenerating; },
		get hasError() { return hasError; },
		get statusMessage() { return statusMessage; },
		
		setGenerating(generating: boolean) {
			isGenerating = generating;
		},
		
		setError(error: boolean) {
			hasError = error;
		},
		
		setStatusMessage(message: string) {
			statusMessage = message;
		},
		
		reset() {
			isGenerating = false;
			hasError = false;
			statusMessage = 'Ready to generate';
		}
	};
}

const generatorStore = createGeneratorStore();

// Export individual reactive values for compatibility
export const isGenerating = $derived(generatorStore.isGenerating);
export const hasError = $derived(generatorStore.hasError);
export const statusMessage = $derived(generatorStore.statusMessage);

export { generatorStore };
