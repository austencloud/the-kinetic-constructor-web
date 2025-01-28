// ArrowFactory.ts
import type { Motion } from '../Motion/Motion';
import type { ArrowData } from './ArrowData';
import ArrowSvgMirrorManager from './ArrowSvgMirrorManager';

export function createArrowData(motion: Motion): ArrowData {
	const arrowData: ArrowData = {
		color: motion.color,
		coords: { x: 0, y: 0 },
		loc: 'n',
		rotAngle: 0,
		svgMirrored: false, // Default
		motion: motion,
		svgCenter: { x: 0, y: 0 },
		svgLoaded: false,
		svgData: null,
	};

	const mirrorManager = new ArrowSvgMirrorManager(arrowData);
	mirrorManager.updateMirror();

	return arrowData;
}
