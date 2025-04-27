/**
 * Type definitions for the sequence machine
 */

import type { BeatData as StoreBeatData } from '../stores/sequenceStore';

// Define the type for the input passed to the actor
export interface GenerateSequenceInput {
	generationType: 'circular' | 'freeform';
	generationOptions: SequenceGenerationOptions | FreeformSequenceOptions;
}

// Interface for circular sequence generation options
export interface SequenceGenerationOptions {
	capType: string;
	numBeats: number;
	turnIntensity: number;
	propContinuity: 'continuous' | 'random';
}

// Interface for freeform sequence generation options
export interface FreeformSequenceOptions {
	numBeats: number;
	turnIntensity: number;
	propContinuity: 'continuous' | 'random';
	letterTypes: string[];
}

// Helper function to convert component BeatData to store BeatData
export function convertToStoreBeatData(componentBeats: any[]): StoreBeatData[] {
	return componentBeats.map((beat, index) => ({
		id: beat.id || `beat-${index}`,
		number: beat.number || index + 1,
		letter: beat.letterType || beat.letter || '',
		position: beat.position || '',
		orientation:
			typeof beat.orientation === 'object'
				? `${beat.orientation.blue || 'in'}_${beat.orientation.red || 'in'}`
				: beat.orientation || '',
		turnsTuple: beat.turnIntensity ? String(beat.turnIntensity) : '',
		redPropData: beat.redPropData || null,
		bluePropData: beat.bluePropData || null,
		redArrowData: beat.redArrowData || null,
		blueArrowData: beat.blueArrowData || null,
		metadata: beat.metadata || {}
	}));
}
