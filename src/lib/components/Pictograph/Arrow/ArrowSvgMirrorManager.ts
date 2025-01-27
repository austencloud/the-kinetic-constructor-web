import { ANTI, CLOCKWISE, COUNTER_CLOCKWISE } from '$lib/types/Constants';
import type { ArrowInterface } from './ArrowInterface';

export default class ArrowSvgMirrorManager {
	private arrow: ArrowInterface;

	constructor(arrow: ArrowInterface) {
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

		// log the arrows and its mirrored state
		console.log(this.arrow, this.arrow.svgMirrored);
		
	}
}
