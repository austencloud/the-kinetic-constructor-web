// ArrowFactory.ts
import type { PictographInterface } from '$lib/types/PictographInterface';
import type { Motion } from '../Motion/Motion';
import type { PictographGetter } from '../PictographGetter';
import type { ArrowInterface } from './ArrowInterface';
import ArrowLocationManager from './ArrowLocationManager/ArrowLocationManager';
import ArrowRotAngleManager from './ArrowRotAngleManager/ArrowRotAngleManager';

export function createArrowData(pictographData: PictographInterface, motion: Motion, getter: PictographGetter): ArrowInterface {

	const arrowData: ArrowInterface = {
		color: motion.color,
		coords: { x: 0, y: 0 },
		loc: 'n',
		rotAngle: 0,
		mirrored: false,
		motion: motion,
		svgCenter: { x: 0, y: 0 },
		svgLoaded: false,
	};

	
	return arrowData;
}
