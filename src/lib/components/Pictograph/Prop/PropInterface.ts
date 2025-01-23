import type { Motion } from '../Motion/Motion';
import type { Color, Orientation } from '../Motion/MotionInterface';
import type { PropType } from './PropPlacementManager/PropTypes';

export type RadialMode = 'radial' | 'nonradial';
export type DiamondLoc = 'n' | 's' | 'e' | 'w';
export type BoxLoc = 'ne' | 'se' | 'sw' | 'nw';
export type Loc = 'n' | 's' | 'e' | 'w' | 'ne' | 'se' | 'sw' | 'nw';

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
