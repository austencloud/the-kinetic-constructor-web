import type { Motion } from '../Motion/Motion';
import type { Orientation, PropType } from './PropPlacementManager/PropTypes';

export type RadialMode = 'radial' | 'nonradial';
export type DiamondLocation = 'n' | 's' | 'e' | 'w';
export type BoxLocation = 'ne' | 'se' | 'sw' | 'nw';
export type Location = DiamondLocation | BoxLocation;

export interface PropInterface {
	propType: PropType;
	color: 'red' | 'blue';
	radialMode: RadialMode | null;
	ori: Orientation;
	motion: Motion;
	coords: { x: number; y: number };
	loc: Location;
	svgCenter?: { x: number; y: number };
	rotAngle: number;
}
