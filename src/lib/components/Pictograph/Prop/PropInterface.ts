import type { Motion } from '../Motion/Motion';
import type { Color, Orientation } from '../Motion/MotionInterface';
import type { PropType } from './PropPlacementManager/PropTypes';

export type RadialMode = 'radial' | 'nonradial';
export type DiamondLocation = 'n' | 's' | 'e' | 'w';
export type BoxLocation = 'ne' | 'se' | 'sw' | 'nw';
export type Location = DiamondLocation | BoxLocation | null;

export interface PropInterface {
	propType: PropType;
	color: Color;
	radialMode: RadialMode | null;
	ori: Orientation;
	motion: Motion;
	coords: { x: number; y: number };
	loc: Location;
	rotAngle: number;
	svgCenter: { x: number; y: number };

}
