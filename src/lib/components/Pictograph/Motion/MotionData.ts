import Arrow from '../Arrow/Arrow.svelte';
import Prop from '../Prop/Prop.svelte';
import type { PictographData } from '../../../types/PictographData';
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
import type { ArrowData } from '../Arrow/ArrowData';
import type { PropData } from '../Prop/PropData';

export interface MotionData {
	arrow?: ArrowData | null;
	prop: PropData | null;
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
export interface BlankMotionData {
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

export interface ShiftMotionInterface extends MotionData {
	motionType: 'float';
	handRotDir: 'cw_handpath' | 'ccw_handpath';
}
