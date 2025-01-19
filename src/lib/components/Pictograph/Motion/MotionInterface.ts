export type MotionType = 'anti' | 'pro' | 'static' | 'dash' | 'float';
export type PropRotDir = 'cw' | 'ccw' | 'no_rot';
export type GridMode = 'diamond' | 'box';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Orientation = 'in' | 'out' | 'clock' | 'counter';
export type Location = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type Color = 'blue' | 'red';
export type LeadState = 'leading' | 'trailing';
export type HandRotDir = 'cw_handpath' | 'ccw_handpath';

import Prop from '../Prop/Prop.svelte';
import Arrow from '../Arrow/Arrow.svelte';
import Pictograph from '../Pictograph.svelte';

export interface MotionInterface {
	pictograph: Pictograph;
	arrow?: Arrow | null; // Optional or null for uninitialized state
	prop?: Prop | null; // Optional or null for uninitialized state
	handRotDir: HandRotDir;
	motionType: MotionType;
	startLoc: Location;
	endLoc: Location;
	startOri: Orientation;
	endOri: Orientation;
	propRotDir: PropRotDir;
	color: Color;
	turns: number;
	leadState: LeadState;
	prefloatMotionType: MotionType | null;
	prefloatPropRotDir: PropRotDir | null;
}
