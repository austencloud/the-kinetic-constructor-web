// src/lib/components/Pictograph/defaultPictographData.ts
import { DIAMOND } from '$lib/types/Constants';
import type { PictographData } from '$lib/types/PictographData';

/**
 * Provides a default structure for PictographData.
 * Used as an initial state or placeholder.
 * Note: Many fields are intentionally null, indicating they need to be populated.
 */
export const defaultPictographData: PictographData = {
	letter: null,
	startPos: null,
	endPos: null,
	timing: null,
	direction: null,
	gridMode: DIAMOND, // Default grid mode


	// Motion-related data (inputs)
	blueMotionData: null,
	redMotionData: null,

	// Instantiated Motion objects (runtime)
	motions: [], // Potentially redundant if red/blueMotion cover it
	redMotion: null,
	blueMotion: null,

	// Prop-related data (inputs)
	props: [], // Potentially redundant
	redPropData: null, // Input data structure for red prop
	bluePropData: null, // Input data structure for blue prop


	// Grid data (runtime)
	gridData: null,
	redArrowData: null,
	blueArrowData: null,
	grid: ''
};