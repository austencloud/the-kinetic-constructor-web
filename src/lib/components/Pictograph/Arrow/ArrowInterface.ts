import type { Motion } from '../Motion/Motion';
import type { Color } from '../Motion/MotionInterface';
import type { Location } from '../Prop/PropInterface';

export interface ArrowInterface {
	color: Color;
	coords: { x: number; y: number };
	loc: Location | null;
	rotation: number;
	mirrored: boolean;
	motion: Motion;
	svgCenter: { x: number; y: number };
}
