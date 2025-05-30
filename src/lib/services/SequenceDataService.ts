/**
 * Sequence Data Service - Svelte 5 Runes Implementation
 * Provides sequence data management
 */

export interface SequenceStartPos {
	letter: string;
	startPos: string;
	endPos: string;
}

/**
 * Simple sequence data service
 */
class SequenceDataService {
	private sequences: any[] = $state([]);

	getSequences() {
		return this.sequences;
	}

	addSequence(sequence: any) {
		this.sequences.push(sequence);
	}

	clearSequences() {
		this.sequences = [];
	}

	getStartPositions(): SequenceStartPos[] {
		return this.sequences.map(seq => ({
			letter: seq.letter || 'A',
			startPos: seq.startPos || 'center',
			endPos: seq.endPos || 'center'
		}));
	}
}

// Export singleton instance
export const sequenceDataService = new SequenceDataService();
export default sequenceDataService;
