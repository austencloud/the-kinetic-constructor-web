import type { Motion } from '../Motion/Motion';
import type { PropData } from './PropData';
import { PropType } from '../../../types/Types';

export function createPropData(motion: Motion): PropData {
	const propData: PropData = {
		id: generateUniqueId(),
		propType: PropType.STAFF,
		color: motion.color,
		motionId: motion.id,
		coords: { x: 0, y: 0 },
		loc: motion.endLoc,
		ori: motion.endOri,
		radialMode: ['in', 'out'].includes(motion.endOri) ? 'radial' : 'nonradial',
		svgCenter: { x: 0, y: 0 },
		rotAngle: 0
	};
	return propData;
}
export function generateUniqueId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).substr(2, 9)}`;
}
