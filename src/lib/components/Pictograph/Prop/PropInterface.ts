import type { MotionInterface } from '../Motion/MotionInterface';
import type { Orientation } from './PropTypes';

export type RadialMode = 'radial' | 'nonradial';

export interface PropInterface {
	propType: string;
	color: 'red' | 'blue';
	radialMode: RadialMode | null;
	ori: Orientation | null;
	motion: MotionInterface;
	coords: { x: number; y: number };
}
