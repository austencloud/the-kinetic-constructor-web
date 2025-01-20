import type { Motion } from '../Motion/Motion';
import type { MotionInterface, Location } from '../Motion/MotionInterface';
import type { Orientation } from './PropTypes';

export type RadialMode = 'radial' | 'nonradial';

export interface PropInterface {
	propType: string;
	color: 'red' | 'blue';
	radialMode: RadialMode | null;
	ori: Orientation;
	motion: Motion;
	coords: { x: number; y: number };
	loc: Location;
}
