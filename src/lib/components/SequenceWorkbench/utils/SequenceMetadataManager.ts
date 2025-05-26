import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer.svelte';

/**
 * Interface for sequence metadata
 */
export interface SequenceMetadata {
	name: string;
	difficulty: number;
}

/**
 * Interface for the sequence metadata manager return value
 */
export interface SequenceMetadataManagerResult {
	metadata: SequenceMetadata;
	unsubscribe: () => void;
}

/**
 * Manages sequence metadata by subscribing to the sequence store
 * @param onUpdate Callback function to update metadata values
 * @returns Object with metadata and unsubscribe function
 */
export function useSequenceMetadata(
	onUpdate: (metadata: SequenceMetadata) => void
): SequenceMetadataManagerResult {
	// Initialize metadata with default values
	const metadata: SequenceMetadata = {
		name: '',
		difficulty: 0
	};

	// Use the modern container for metadata updates - NO STORES!
	// Since we're using runes, we can directly access the state
	metadata.name = sequenceContainer.state.metadata.name;
	metadata.difficulty = sequenceContainer.state.metadata.difficulty;

	// Call the update callback with the initial metadata
	onUpdate(metadata);

	// Return a no-op unsubscribe function for compatibility
	const unsubscribe = () => {};

	return {
		metadata,
		unsubscribe
	};
}
