import type { Letter } from './Letter';
import type { MotionInterface } from '../components/Pictograph/Motion/MotionInterface';
import type { TKAPosition } from './TKAPosition';
import type { PropInterface } from '$lib/components/Pictograph/Prop/PropInterface';
import type { Motion } from '$lib/components/Pictograph/Motion/Motion';

export type VTGDir = 'tog' | 'opp';
export type VTGTiming = 'split' | 'same';
export type GridMode = 'diamond' | 'box';
export interface PictographInterface {
	letter: Letter | null;
	startPos: TKAPosition | null;
	endPos: TKAPosition | null;
	timing: VTGTiming | null;
	direction: VTGDir | null;
	gridMode: GridMode | null;
	blueMotionData: MotionInterface | null;
	redMotionData: MotionInterface | null;

	motions: Motion[];
	redMotion: Motion | null;
	blueMotion: Motion | null;

	props: PropInterface[];
	redPropData: PropInterface | null;
	bluePropData: PropInterface | null;
}
