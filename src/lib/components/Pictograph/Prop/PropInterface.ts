import type { MotionInterface } from "../Motion/MotionInterface";

export interface PropInterface {
	propType: string;
	color: 'red' | 'blue';
	motion: MotionInterface;
}
