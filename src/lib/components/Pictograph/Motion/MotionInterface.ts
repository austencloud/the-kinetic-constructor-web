import Arrow from '../Arrow/Arrow.svelte';
import Prop from '../Prop/Prop.svelte';
import type { PictographInterface } from '../../../types/PictographInterface';
import type {
	Color,
	HandRotDir,
	LeadState,
	Loc,
	MotionType,
	Orientation,
	PropRotDir,
	TKATurns
} from '../types/Types';
import type { ArrowInterface } from '../Arrow/ArrowInterface';
import type { PropInterface } from '../Prop/PropInterface';

export interface MotionInterface {
	pictographData: PictographInterface;
    arrow?: ArrowInterface | null;
    prop: PropInterface | null;
	handRotDir: HandRotDir | null;
	motionType: MotionType;
	startLoc: Loc;
	endLoc: Loc;
	startOri: Orientation;
	endOri: Orientation | null;
	propRotDir: PropRotDir;
	color: Color;
	turns: TKATurns;
	leadState: LeadState;
	prefloatMotionType: MotionType | null;
	prefloatPropRotDir: PropRotDir | null;
}
export interface BlankMotionInterface {
	pictographData: {
		letter: null;
		startPos: null;
		endPos: null;
		timing: null;
		direction: null;
		gridMode: null;
		blueMotionData: null;
		redMotionData: null;
	};
	arrow: null;
	prop: null;
	handRotDir: null;
	motionType: null;
	startLoc: null;
	endLoc: null;
	startOri: null;
	endOri: null;
	propRotDir: null;
	color: null;
	turns: null;
	leadState: null;
	prefloatMotionType: null;
	prefloatPropRotDir: null;
}

export interface ShiftMotionInterface extends MotionInterface {
	motionType: 'float';
	handRotDir: 'cw_handpath' | 'ccw_handpath';
}
