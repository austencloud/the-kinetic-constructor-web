/**
 * Sequence Service - API and Data Management
 */

export async function fetchSequences() {
	// Mock implementation
	return [];
}

export async function updateFavoriteStatus(sequenceId: string, variationId: string, isFavorite: boolean) {
	// Mock implementation
	console.log('Update favorite status:', { sequenceId, variationId, isFavorite });
}

export async function deleteVariationApi(sequenceId: string, variationId: string) {
	// Mock implementation
	console.log('Delete variation:', { sequenceId, variationId });
}

export async function deleteSequenceApi(sequenceId: string) {
	// Mock implementation
	console.log('Delete sequence:', { sequenceId });
}
