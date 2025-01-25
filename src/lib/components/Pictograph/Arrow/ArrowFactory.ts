// ArrowFactory.ts
import type { Motion } from '../Motion/Motion';
import type { PictographGetter } from '../PictographGetter';
import type { ArrowInterface } from './ArrowInterface';
import ArrowLocationManager from './ArrowLocationManager/ArrowLocationManager';
import ArrowRotAngleManager from './ArrowRotAngleManager/ArrowRotAngleManager';

export function createArrowData(motion: Motion, getter: PictographGetter): ArrowInterface {
	const locationManager = new ArrowLocationManager(motion, getter);
	const loc = locationManager.getArrowLocation();

	const arrowData: ArrowInterface = {
		color: motion.color,
		coords: { x: 0, y: 0 },
		loc: loc,
		rotAngle: 0,
		mirrored: false,
		motion: motion,
		svgCenter: { x: 0, y: 0 }
	};

	const rotAngleManager = new ArrowRotAngleManager(motion, loc);
	arrowData.rotAngle = rotAngleManager.updateRotation();
	return arrowData;
}
