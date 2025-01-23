import type { ArrowInterface } from './ArrowInterface';
import type { PropRotDir } from '../Motion/MotionInterface';
export default class ArrowMirrorManager {
	constructor(private arrowData: ArrowInterface) {}

	// ArrowMirrorManager.ts
	updateMirror() {
		const mirrorConditions: Record<string, Record<PropRotDir, boolean>> = {
			anti: {
				cw: true,
				ccw: false,
				no_rot: false
			},
			other: {
				cw: false,
				ccw: true,
				no_rot: false
			}
		};

		return (
			mirrorConditions[this.arrowData.motion.motionType]?.[this.arrowData.motion.propRotDir] ??
			mirrorConditions.other[this.arrowData.motion.propRotDir]
		);
	}
}
