export type MotionType = 'anti' | 'pro' | 'static' | 'dash' | 'float';
export type PropRotDir = 'cw' | 'ccw' | 'no_rot';
export type GridMode = 'diamond' | 'box';
export type Direction = 'up' | 'down' | 'left' | 'right' | 'upright' | 'upleft' | 'downright' | 'downleft';
export type Location = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type Color = 'blue' | 'red';
export type LeadState = 'leading' | 'trailing' | null;
export type HandRotDir = 'cw_handpath' | 'ccw_handpath';

import Prop from '../Prop/Prop.svelte';
import Arrow from '../Arrow/Arrow.svelte';
import type { Orientation } from '../Prop/PropTypes';
import type { PictographInterface } from '../../../types/PictographInterface';

export interface MotionInterface {
	pictographData: PictographInterface;
	arrow?: Arrow | null; // Optional or null for uninitialized state
	prop?: Prop | null; // Optional or null for uninitialized state
	handRotDir: HandRotDir | null;
	motionType: MotionType;
	startLoc: Location;
	endLoc: Location;
	startOri: Orientation;
	endOri: Orientation | null;
	propRotDir: PropRotDir;
	color: Color;
	turns: number;
	leadState: LeadState;
	prefloatMotionType: MotionType | null;
	prefloatPropRotDir: PropRotDir | null;
}
