import type { ArrowInterface } from './Arrow/ArrowInterface';
import type { Motion } from './Motion/Motion';

export function createArrowData(motion: Motion): ArrowInterface {
	const arrowData: ArrowInterface = {
		color: motion.color,
		coords: { x: 0, y: 0 },
		loc: null,
		rotAngle: 0,
		mirrored: false,
		motion: motion,
		svgCenter: { x: 0, y: 0 }
	};
	return arrowData;
}
