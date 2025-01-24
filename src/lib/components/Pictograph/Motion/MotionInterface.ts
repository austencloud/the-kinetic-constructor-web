export type MotionType = 'anti' | 'pro' | 'static' | 'dash' | 'float';
export type ShiftMotionType = 'pro' | 'anti' | 'float';
export type PropRotDir = 'cw' | 'ccw' | 'no_rot';
export type GridMode = 'diamond' | 'box';
export type Direction =
	| 'up'
	| 'down'
	| 'left'
	| 'right'
	| 'upright'
	| 'upleft'
	| 'downright'
	| 'downleft';
export type Color = 'blue' | 'red' | null;
export type LeadState = 'leading' | 'trailing' | null;
export type HandRotDir = 'cw_handpath' | 'ccw_handpath' | 'dash' | 'static' | null;
export type ShiftHandRotDir = 'cw_handpath' | 'ccw_handpath';
export type Orientation = 'in' | 'out' | 'clock' | 'counter';
import type { Loc } from '../Prop/PropInterface';
import Arrow from '../Arrow/Arrow.svelte';
import Prop from '../Prop/Prop.svelte';
import type { PictographInterface } from '../../../types/PictographInterface';

export interface MotionInterface {
	pictographData: PictographInterface;
	arrow?: Arrow | null;
	prop: Prop | null;
	handRotDir: HandRotDir | null;
	motionType: MotionType;
	startLoc: Loc;
	endLoc: Loc;
	startOri: Orientation;
	endOri: Orientation | null;
	propRotDir: PropRotDir;
	color: Color;
	turns: number;
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
