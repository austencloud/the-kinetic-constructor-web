// ArrowFactory.ts
import type { PictographInterface } from '$lib/types/PictographInterface';
import type { Motion } from '../Motion/Motion';
import type { PictographGetter } from '../PictographGetter';
import type { ArrowInterface } from './ArrowInterface';
import ArrowLocationManager from './ArrowLocationManager/ArrowLocationManager';
import ArrowSvgMirrorManager from './ArrowSvgMirrorManager';
import ArrowRotAngleManager from './ArrowRotAngleManager/ArrowRotAngleManager';

export function createArrowData(motion: Motion): ArrowInterface {
	const arrowData: ArrowInterface = {
		color: motion.color,
		coords: { x: 0, y: 0 },
		loc: 'n',
		rotAngle: 0,
		svgMirrored: false, // Default
		motion: motion,
		svgCenter: { x: 0, y: 0 },
		svgLoaded: false
	};

	// Initialize mirroring manager to set the mirrored state
	const mirrorManager = new ArrowSvgMirrorManager(arrowData);
	mirrorManager.updateMirror();

	return arrowData;
}
