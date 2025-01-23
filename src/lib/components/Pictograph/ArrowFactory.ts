import type { ArrowInterface } from './Arrow/ArrowInterface';
import type { Motion } from './Motion/Motion';

export function createArrowData(motion: Motion): ArrowInterface {
	const propData: ArrowInterface = {
		color: motion.color,
		coords: { x: 0, y: 0 },
		loc: 'n',
		rotation: 0,
		mirrored: false,
		motion: motion
	};
	return propData;
}
