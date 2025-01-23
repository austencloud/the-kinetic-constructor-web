import type { ArrowInterface } from './ArrowInterface';

export default class ArrowSvgManager {
	constructor(private arrowData: ArrowInterface) {}

	getSvgPath(): string {
		const basePath = '/images/arrows';
		const motionType = this.arrowData.motion.motionType.toLowerCase();
		const orientationType = this.arrowData.motion.startOri.toLowerCase();
		const turns = this.arrowData.motion.turns;
		const radialPath =
		this.arrowData.motion.startOri === 'out' || this.arrowData.motion.startOri === 'in'
			? 'from_radial'
			: 'from_nonradial';
		if (motionType === 'float') {
			return `${basePath}/float.svg`;
		}
		return `${basePath}/${motionType}/${radialPath}/${motionType}_${turns.toFixed(1)}.svg`;
	}
}

