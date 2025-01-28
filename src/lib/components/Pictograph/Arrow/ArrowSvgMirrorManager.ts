import { ANTI, CLOCKWISE, COUNTER_CLOCKWISE } from '$lib/types/Constants';
import type { ArrowData } from './ArrowData';

export default class ArrowSvgMirrorManager {
	private arrow: ArrowData;

	constructor(arrow: ArrowData) {
		this.arrow = arrow;
		this.updateMirror();
	}

	// Updates the mirrored state of the arrow
	updateMirror(): void {
		const mirrorConditions: { [key: string]: { [key: string]: boolean } } = {
			[ANTI]: {
				[CLOCKWISE]: true,
				[COUNTER_CLOCKWISE]: false
			},
			other: {
				[CLOCKWISE]: false,
				[COUNTER_CLOCKWISE]: true
			}
		};

		const motionType = this.arrow.motion.motionType;
		const propRotDir = this.arrow.motion.propRotDir;

		if (motionType in mirrorConditions) {
			this.arrow.svgMirrored = mirrorConditions[motionType]?.[propRotDir] || false;
		} else {
			this.arrow.svgMirrored = mirrorConditions.other?.[propRotDir] || false;
		}
		// log the value
	}
}
