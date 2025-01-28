import type { Letter } from './Letter';
import type { TKAPosition } from './TKAPosition';
import type { Motion } from '$lib/components/Pictograph/Motion/Motion';
import type { GridMode, VTGDir, VTGTiming } from '$lib/components/Pictograph/types/Types';
import type { PropData } from '$lib/components/Pictograph/Prop/PropData';
import type { MotionData } from '$lib/components/Pictograph/Motion/MotionData';

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
}
