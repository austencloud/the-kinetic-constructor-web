import type { Motion } from '../Motion/Motion';
import type { Color } from '../Motion/MotionInterface';
import type { Loc } from '../Prop/PropInterface';

export interface ArrowInterface {
	color: Color;
	coords: { x: number; y: number };
	loc: Loc | null;
	rotAngle: number;
	mirrored: boolean;
	motion: Motion;
	svgCenter: { x: number; y: number };
}
