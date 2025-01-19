import type { Letter } from './Letter';
import type { MotionInterface } from '../components/Pictograph/Motion/MotionInterface';
import type { TKAPosition } from './TKAPosition';

export type VTGDir = 'tog' | 'opp';
export type VTGTiming = 'split' | 'same';

export interface PictographInterface {
	letter: Letter;
	startPos: TKAPosition;
	endPos: TKAPosition;
	timing: VTGTiming;
	direction: VTGDir;
	gridMode: 'diamond' | 'box';
	blueMotionData: MotionInterface; // Interface, not instance
	redMotionData: MotionInterface; // Interface, not instance
	motionData: MotionInterface[]; // Use interfaces to keep it decoupled
}
