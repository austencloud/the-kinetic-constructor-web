import type { Location } from '../../Prop/PropInterface';
import Arrow from '../Arrow.svelte';

export default class ShiftLocationCalculator {
	arrow: Arrow;
	pictograph: any;

	constructor(arrow: Arrow) {
		this.arrow = arrow;
	}

	calculateLocation(): Location {
		const startLoc = this.arrow.motion.startLoc;
		const endLoc = this.arrow.motion.endLoc;

		const locationMap: { [key: string]: Location } = {
			'n-e': 'ne',
			'e-s': 'se',
			's-w': 'sw',
			'w-n': 'nw',
			'ne-nw': 'n',
			'ne-se': 'e',
			'sw-se': 's',
			'nw-sw': 'w'
		};

		const key = `${startLoc}-${endLoc}`;
		const location = locationMap[key] || null;

		console.log('Calculated Location:', location);
		return location;
	}
}
