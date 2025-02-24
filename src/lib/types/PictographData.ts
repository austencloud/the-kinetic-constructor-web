import type { Motion } from '$lib/components/objects/Motion/Motion.js';
import type { MotionData } from '$lib/components/objects/Motion/MotionData.js';
import type { PropData } from '$lib/components/objects/Prop/PropData.js';
import type { Letter } from './Letter.js';
import type { TKAPosition } from './TKAPosition.js';
import type { GridMode, VTGDir, VTGTiming } from './Types.js';

export interface PictographData {
	letter: Letter | null;
	startPos: TKAPosition | null;
	endPos: TKAPosition | null;
	timing: VTGTiming | null;
	direction: VTGDir | null;
	gridMode: GridMode;
	blueMotionData: MotionData | null;
	redMotionData: MotionData | null;

	redMotion: Motion | null;
	blueMotion: Motion | null;

	redPropData: PropData | null;
	bluePropData: PropData | null;

	grid: string;
}
