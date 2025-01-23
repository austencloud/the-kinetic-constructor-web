import type { Motion } from './Motion/Motion';
import type { PropInterface } from './Prop/PropInterface';
import type { DefaultPropPositioner } from './Prop/PropPlacementManager/DefaultPropPositioner';
import PropRotAngleManager from './Prop/PropRotAngleManager';

export function updatePropData(motion: Motion, positioner: DefaultPropPositioner): PropInterface {
	const rotAngleManager = new PropRotAngleManager({
		loc: motion.endLoc,
		ori: motion.endOri
	});
	const propData: PropInterface = {
		propType: 'staff',
		color: motion.color,
		motion,
		coords: { x: 0, y: 0 },
		loc: motion.endLoc,
		ori: motion.endOri,
		radialMode: 'radial',
		svgCenter: { x: 0, y: 0 },
		rotAngle: rotAngleManager.getRotationAngle()
	};

	positioner.updateCoords(propData);
	return propData;
}
