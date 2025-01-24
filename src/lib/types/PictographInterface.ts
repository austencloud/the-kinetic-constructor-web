import type { Letter } from './Letter';
import type { TKAPosition } from './TKAPosition';
import type { PropInterface } from '$lib/components/Pictograph/Prop/PropInterface';
import type { Motion } from '$lib/components/Pictograph/Motion/Motion';
import type { GridMode, VTGDir, VTGTiming } from '$lib/components/Pictograph/types/Types';
import type { MotionInterface } from '$lib/components/Pictograph/Motion/MotionInterface';


export interface PictographInterface {
	letter: Letter | null;
	startPos: TKAPosition | null;
	endPos: TKAPosition | null;
	timing: VTGTiming | null;
	direction: VTGDir | null;
	gridMode: GridMode;
	blueMotionData: MotionInterface | null;
	redMotionData: MotionInterface | null;

	motions: Motion[];
	redMotion: Motion | null;
	blueMotion: Motion | null;

	props: PropInterface[];
	redPropData: PropInterface | null;
	bluePropData: PropInterface | null;
}
