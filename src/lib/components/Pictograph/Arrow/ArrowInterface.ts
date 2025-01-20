import type { Motion } from '../Motion/Motion';

export interface ArrowInterface {
	color: 'red' | 'blue';
	position: { x: number; y: number };
	rotation: number;
	mirrored: boolean;
	motion: Motion;
}
