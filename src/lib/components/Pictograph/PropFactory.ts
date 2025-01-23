import type { Motion } from './Motion/Motion';
import type { PropInterface } from './Prop/PropInterface';
import { PropType } from './Prop/PropPlacementManager/PropTypes';

export function createPropData(
	motion: Motion,
): PropInterface {

	const propData: PropInterface = {
		propType: PropType.STAFF,
		color: motion.color,
		motion,
		coords: { x: 0, y: 0 },
		loc: motion.endLoc,
		ori: motion.endOri,
		radialMode: ['in', 'out'].includes(motion.endOri) ? 'radial' : 'nonradial',

	};
	return propData;
}
