import type { MotionType, Location, Orientation } from '../types/MotionTypes';

export class MotionOriCalculator {
	motion: any;

	constructor(motion: any) {
		this.motion = motion;
	}

	calculateEndOri(): string {
		if (this.motion.motionType === 'float') {
			return this.calculateFloatOrientation();
		}

		const validTurns = [0, 0.5, 1, 1.5, 2, 2.5, 3];
		if (validTurns.includes(this.motion.turns)) {
			if (this.motion.turns % 1 === 0) {
				return this.calculateWholeTurnOrientation();
			} else {
				return this.calculateHalfTurnOrientation();
			}
		}

		return this.motion.startOri;
	}

	private calculateWholeTurnOrientation(): string {
		const { motionType, startOri } = this.motion;
		const isEven = this.motion.turns % 2 === 0;
		return motionType === 'pro' || motionType === 'static'
			? isEven
				? startOri
				: this.switchOrientation(startOri)
			: isEven
				? this.switchOrientation(startOri)
				: startOri;
	}
	calculateHalfTurnOrientation(): string {
		const { motionType, turns, startOri, propRotDir } = this.motion;

		const orientationMap: Record<string, string> = {
			'anti,cw,in': turns % 2 === 0.5 ? 'clock' : 'counter',
			'anti,ccw,in': turns % 2 === 0.5 ? 'counter' : 'clock',
			'anti,cw,out': turns % 2 === 0.5 ? 'counter' : 'clock',
			'anti,ccw,out': turns % 2 === 0.5 ? 'clock' : 'counter',
			'anti,cw,clock': turns % 2 === 0.5 ? 'out' : 'in',
			'anti,ccw,clock': turns % 2 === 0.5 ? 'in' : 'out',
			'anti,cw,counter': turns % 2 === 0.5 ? 'in' : 'out',
			'anti,ccw,counter': turns % 2 === 0.5 ? 'out' : 'in',

			'pro,cw,in': turns % 2 === 0.5 ? 'counter' : 'clock',
			'pro,ccw,in': turns % 2 === 0.5 ? 'clock' : 'counter',
			'pro,cw,out': turns % 2 === 0.5 ? 'clock' : 'counter',
			'pro,ccw,out': turns % 2 === 0.5 ? 'counter' : 'clock',
			'pro,cw,clock': turns % 2 === 0.5 ? 'in' : 'out',
			'pro,ccw,clock': turns % 2 === 0.5 ? 'out' : 'in',
			'pro,cw,counter': turns % 2 === 0.5 ? 'out' : 'in',
			'pro,ccw,counter': turns % 2 === 0.5 ? 'in' : 'out'
		};

		return orientationMap[`${motionType},${propRotDir},${startOri}`] || startOri;
	}

	calculateFloatOrientation(): string {
		const { startOri } = this.motion;
		const handpathDirection = this.motion.handRotDirCalculator.getHandRotDir(
			this.motion.startLoc,
			this.motion.endLoc
		);

		const orientationMap: Record<string, Record<string, string>> = {
			in: { cw_handpath: 'clock', ccw_handpath: 'counter' },
			out: { cw_handpath: 'counter', ccw_handpath: 'clock' },
			clock: { cw_handpath: 'out', ccw_handpath: 'in' },
			counter: { cw_handpath: 'in', ccw_handpath: 'out' }
		};

		return orientationMap[startOri]?.[handpathDirection] || startOri;
	}

	private switchOrientation(ori: 'in' | 'out' | 'clock' | 'counter'): string {
		const orientationMap: { [key in 'in' | 'out' | 'clock' | 'counter']: string } = {
			in: 'out',
			out: 'in',
			clock: 'counter',
			counter: 'clock'
		};
		return orientationMap[ori];
	}
}
