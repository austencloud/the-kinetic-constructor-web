import { DIAMOND } from '$lib/types/Constants';
import type { PictographInterface } from '$lib/types/PictographInterface';

export const defaultPictographData: PictographInterface = {
	letter: null,
	startPos: null,
	endPos: null,
	timing: null,
	direction: null,
	gridMode: DIAMOND,
	blueMotionData: null,
	redMotionData: null,

	motions: [],
	redMotion: null,
	blueMotion: null,

	props: [],
	redPropData: null,
	bluePropData: null
};
