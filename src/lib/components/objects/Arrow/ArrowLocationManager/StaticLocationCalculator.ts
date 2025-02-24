import type { Motion } from '../../../objects/Motion/Motion';

export default class StaticLocationCalculator {
	motion: Motion;

	constructor(motion: Motion) {
		this.motion = motion;
	}

	calculateLocation() {
		return this.motion.startLoc; // Return the arrow's starting location
	}
}
