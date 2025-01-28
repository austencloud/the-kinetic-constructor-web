import type { Motion } from './Motion/Motion';
import type { PropData } from './Prop/PropData';
import { PropType } from './types/Types';

export function createPropData(motion: Motion): PropData {
	const propData: PropData = {
		propType: PropType.STAFF,
		color: motion.color,
		motion,
		coords: { x: 0, y: 0 },
		loc: motion.endLoc,
		ori: motion.endOri,
		radialMode: ['in', 'out'].includes(motion.endOri) ? 'radial' : 'nonradial',
		svgCenter: { x: 0, y: 0 },
		rotAngle: 0
	};
	return propData;
}
