import type { Orientation } from '../Motion/MotionInterface';
import type { Location } from './PropInterface';
export default class PropRotAngleManager {
	private loc: Location;
	private ori: Orientation | null;

	constructor({ loc, ori }: { loc: Location; ori: Orientation }) {
		this.loc = loc;
		this.ori = ori;
	}

	getRotationAngle(): number {
		const isDiamondLocation = ['n', 'e', 's', 'w'].includes(this.loc);
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

		const orientationAngles = angleMap[this.ori as Orientation];
		// log it before returning it
		return orientationAngles?.[this.loc as Location] ?? 0;
	}
}
