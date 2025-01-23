import type { Motion } from '../Motion/Motion';
import type { Color } from '../Motion/MotionInterface';

export default class ArrowSvgManager {
	private motion: Motion;
	private color: Color;
	constructor(arrowProps: { motion: Motion; color: Color }) {
		this.motion = arrowProps.motion;
		this.color = arrowProps.color;
	}

	getSvgPath(): string {
		const basePath = '/images/arrows';
		const typePath = this.motion.motionType.toLowerCase();
		const radialPath =
			this.motion.startOri === 'out' || this.motion.startOri === 'in'
				? 'from_radial'
				: 'from_nonradial';
		const turns = this.motion.turns.toFixed(1); // Convert turns to float with one decimal place
		const motionType = this.motion.motionType;
		const svgPath = `${basePath}/${typePath}/${radialPath}/${motionType}_${turns}.svg`;
		return svgPath;
	}

	updateSvgAppearance(): { backgroundColor: string } {
		return { backgroundColor: this.color };
	}
}
