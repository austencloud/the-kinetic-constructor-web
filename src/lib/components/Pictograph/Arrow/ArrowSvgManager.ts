import type { ArrowInterface } from './ArrowInterface';

export default class ArrowSvgManager {
	constructor(private arrowData: ArrowInterface) {}

	getSvgPath(): string {
		const basePath = '/images/arrows';
		const motionType = this.arrowData.motion.motionType.toLowerCase();
		const turns = this.arrowData.motion.turns;
		const radialPath =
			this.arrowData.motion.startOri === 'out' || this.arrowData.motion.startOri === 'in'
				? 'from_radial'
				: 'from_nonradial';
		if (turns === 'fl' && motionType === 'float') {
			return `${basePath}/float.svg`;
		}
		else
		{
		return `${basePath}/${motionType}/${radialPath}/${motionType}_${Number(turns).toFixed(1)}.svg`;
		}
	}
}
