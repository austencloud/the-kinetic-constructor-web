import type PropAttrManager from './PropAttrManager';
import type { Orientation, Location } from './PropTypes';

export default class PropRotAngleManager {
	attrManager: PropAttrManager;

	constructor(attrManager: PropAttrManager) {
		this.attrManager = attrManager;
	}

	getRotationAngle(): number {
		const { location, orientation } = this.attrManager;

		const isDiamondLocation = ['n', 'e', 's', 'w'].includes(location);
		const diamondAngleMap: Partial<Record<Orientation, Partial<Record<Location, number>>>> = {
			in: { n: 90, s: 270, w: 0, e: 180 },
			out: { n: 270, s: 90, w: 180, e: 0 },
			clock: { n: 0, s: 180, w: 270, e: 90 },
			counter: { n: 180, s: 0, w: 90, e: 270 }
		};

		const boxAngleMap: Partial<Record<Orientation, Partial<Record<Location, number>>>> = {
			in: { ne: 135, nw: 45, sw: 315, se: 225 },
			out: { ne: 315, nw: 225, sw: 135, se: 45 },
			clock: { ne: 45, nw: 315, sw: 225, se: 135 },
			counter: { ne: 225, nw: 135, sw: 45, se: 315 }
		};

		const angleMap = isDiamondLocation ? diamondAngleMap : boxAngleMap;

		// Type assertion ensures TypeScript treats `orientation` and `location` as valid keys
		const orientationAngles = angleMap[orientation as Orientation];
		return orientationAngles?.[location as Location] ?? 0;
	}
}
