import type { Motion } from '../Motion/Motion';
import type { ArrowSvgData } from '../SvgManager/ArrowSvgData';
import type { Color, Loc } from '../types/Types';

export interface ArrowData {
	color: Color;
	coords: { x: number; y: number };
	loc: Loc;
	rotAngle: number;
	svgMirrored: boolean;
	motion: Motion;
	svgCenter: { x: number; y: number };
	svgLoaded: boolean;
	svgData: ArrowSvgData | null;
}
