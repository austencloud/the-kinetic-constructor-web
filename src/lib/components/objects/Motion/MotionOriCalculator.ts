import { CLOCK, COUNTER, FLOAT, IN, OUT, PRO, STATIC } from '$lib/types/Constants';
import type { Motion } from './Motion';
import type {
	MotionType,
	HandRotDir,
	ShiftMotionType,
	ShiftMotionInterface,
	ShiftHandRotDir,
	Orientation
} from './MotionData';

export class MotionOriCalculator {
	motion: any;

	constructor(motion: any) {
		this.motion = motion;
	}

	calculateEndOri(): Orientation {
		if (this.motion.motionType === FLOAT) {
			return this.calculateFloatOrientation(
				this.motion,
				this.motion.motionData as ShiftMotionInterface
			);
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

	private calculateWholeTurnOrientation(): Orientation {
		const { motionType, startOri } = this.motion;
		const isEven = this.motion.turns % 2 === 0;
		return motionType === PRO || motionType === STATIC
			? isEven
				? startOri
				: this.switchOrientation(startOri)
			: isEven
				? this.switchOrientation(startOri)
				: startOri;
	}

	private calculateHalfTurnOrientation(): Orientation {
		const { motionType, turns, startOri, propRotDir } = this.motion;

		const orientationMap: Record<string, string> = {
			'anti,cw,in': turns % 2 === 0.5 ? CLOCK : COUNTER,
			'anti,ccw,in': turns % 2 === 0.5 ? COUNTER : CLOCK,
			'anti,cw,out': turns % 2 === 0.5 ? COUNTER : CLOCK,
			'anti,ccw,out': turns % 2 === 0.5 ? CLOCK : COUNTER,
			'anti,cw,clock': turns % 2 === 0.5 ? OUT : IN,
			'anti,ccw,clock': turns % 2 === 0.5 ? IN : OUT,
			'anti,cw,counter': turns % 2 === 0.5 ? IN : OUT,
			'anti,ccw,counter': turns % 2 === 0.5 ? OUT : IN,

			'pro,cw,in': turns % 2 === 0.5 ? COUNTER : CLOCK,
			'pro,ccw,in': turns % 2 === 0.5 ? CLOCK : COUNTER,
			'pro,cw,out': turns % 2 === 0.5 ? CLOCK : COUNTER,
			'pro,ccw,out': turns % 2 === 0.5 ? COUNTER : CLOCK,
			'pro,cw,clock': turns % 2 === 0.5 ? IN : OUT,
			'pro,ccw,clock': turns % 2 === 0.5 ? OUT : IN,
			'pro,cw,counter': turns % 2 === 0.5 ? OUT : IN,
			'pro,ccw,counter': turns % 2 === 0.5 ? IN : OUT
		};

		return orientationMap[`${motionType},${propRotDir},${startOri}`] || startOri;
	}

	private calculateFloatOrientation(motion: Motion, motionData: ShiftMotionInterface): Orientation {
		const { startOri } = motionData;
		const handrotDir: HandRotDir = motion.handRotDirCalculator.getHandRotDir(
			motionData.startLoc,
			motionData.endLoc
		);
		if (handrotDir && !['cw_handpath', 'ccw_handpath'].includes(handrotDir)) {
			throw new Error('Invalid handpath direction while calculating float orientation');
		}

		const orientationMap: Record<Orientation, Record<ShiftHandRotDir, Orientation>> = {
			in: {
				cw_handpath: CLOCK,
				ccw_handpath: COUNTER
			},
			out: {
				cw_handpath: COUNTER,
				ccw_handpath: CLOCK
			},
			clock: {
				cw_handpath: OUT,
				ccw_handpath: IN
			},
			counter: {
				cw_handpath: IN,
				ccw_handpath: OUT
			}
		};

		if (!handrotDir) {
			throw new Error('Invalid handpath direction');
		}
		return orientationMap[startOri][handrotDir as ShiftHandRotDir];
	}

	private switchOrientation(ori: Orientation): string {
		const orientationMap: { [key in Orientation]: string } = {
			in: OUT,
			out: IN,
			clock: COUNTER,
			counter: CLOCK
		};
		return orientationMap[ori];
	}
}
