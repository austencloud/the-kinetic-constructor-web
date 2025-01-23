import type { Motion } from '../Motion/Motion';
import type { Orientation, PropType } from './PropTypes';

export type RadialMode = 'radial' | 'nonradial';
export type Location = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface PropInterface {
	propType: PropType;
	color: 'red' | 'blue';
	radialMode: RadialMode | null;
	ori: Orientation;
	motion: Motion;
	coords: { x: number; y: number };
	loc: Location;
	svgCenter?: { x: number; y: number };
	rotAngle : number;
}	
			