import { ANTI, CLOCKWISE, COUNTER_CLOCKWISE, NO_ROT, DASH, STATIC } from '$lib/types/Constants';
import type { ArrowData } from './ArrowData';

export default class ArrowSvgMirrorManager {
	private arrow: ArrowData;

	constructor(arrow: ArrowData) {
		this.arrow = arrow;
		this.updateMirror(); // Initialize mirroring state immediately
	}

	/**
	 * Updates the mirrored state of the arrow based on motion type and rotation direction
	 * This matches the Python implementation's behavior
	 */
	updateMirror(): void {
		// Skip mirroring for no rotation
		if (this.arrow.propRotDir === NO_ROT) {
			this.arrow.svgMirrored = false;
			return;
		}

		// Define mirror conditions lookup table
		const mirrorConditions: { [key: string]: { [key: string]: boolean } } = {
			[ANTI]: {
				[CLOCKWISE]: true,
				[COUNTER_CLOCKWISE]: false
			},
			// Default conditions for other motion types
			other: {
				[CLOCKWISE]: false,
				[COUNTER_CLOCKWISE]: true
			}
		};

		const motionType = this.arrow.motionType;
		const propRotDir = this.arrow.propRotDir;

		// Look up in the mirror conditions table
		if (motionType in mirrorConditions) {
			// If we have specific rules for this motion type, use them
			this.arrow.svgMirrored = mirrorConditions[motionType][propRotDir] || false;
		} else {
			// Otherwise use the default rules
			this.arrow.svgMirrored = mirrorConditions.other[propRotDir] || false;
		}

		// Special case handling for DASH motions
		if (motionType === DASH && typeof this.arrow.turns === 'number' && this.arrow.turns === 0) {
			// For zero-turn dash, we need special mirroring rules based on start/end locations
			// This would be implemented based on the Python version's logic
			// ...
		}

		// Special case handling for STATIC motions
		if (motionType === STATIC) {
			// Static motions may have special mirroring rules
			// ...
		}

		// For debugging
	}
}