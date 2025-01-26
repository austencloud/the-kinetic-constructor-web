export type VTGTiming = 'split' | 'tog';
export type VTGDir = 'same' | 'opp';
export type GridMode = 'diamond' | 'box';
export type DirRelation = 's' | 'o';
export type MotionType = 'anti' | 'pro' | 'static' | 'dash' | 'float';
export type ShiftMotionType = 'pro' | 'anti' | 'float';
export type PropRotDir = 'cw' | 'ccw' | 'no_rot';
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
export type TKATurns = 'fl' | 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3;
