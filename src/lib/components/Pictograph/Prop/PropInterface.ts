import type { Motion } from '../Motion/Motion';
import type { Color, Loc, Orientation, PropType, RadialMode } from '../types/Types';


export interface PropInterface {
	propType: PropType;
	color: Color;
	radialMode: RadialMode | null;
	ori: Orientation;
	motion: Motion;
	coords: { x: number; y: number };
	loc: Loc;
	rotAngle: number;
	svgCenter: { x: number; y: number };
}
