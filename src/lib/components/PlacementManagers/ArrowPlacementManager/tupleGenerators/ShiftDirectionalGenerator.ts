// ShiftDirectionalGenerator.ts
import { BaseDirectionalGenerator } from './BaseDirectionalGenerator';
import {
	ANTI,
	CCW_HANDPATH,
	CLOCKWISE,
	COUNTER_CLOCKWISE,
	CW_HANDPATH,
	DIAMOND,
	FLOAT,
	PRO
} from '$lib/types/Constants';
import type { Motion } from '$lib/components/objects/Motion/Motion';
import type { ShiftMotionType } from '$lib/types/Types';

export class ShiftDirectionalGenerator extends BaseDirectionalGenerator {
	constructor(motion: Motion) {
		super(motion);
	}

	public generateDirectionalTuples(x: number, y: number): Array<[number, number]> {
		const gridMode = this._get_grid_mode(); // 'diamond' | 'box'
		console.log('grid mode:', gridMode);
		let directionalFn: (x: number, y: number) => Array<[number, number]>;

		if (gridMode === DIAMOND) {
			const diamondMap: Record<ShiftMotionType, (x: number, y: number) => Array<[number, number]>> =
				{
					[PRO]: this._generate_diamond_pro_directional_tuples.bind(this),
					[ANTI]: this._generate_diamond_anti_directional_tuples.bind(this),
					[FLOAT]: this._generate_diamond_float_directional_tuples.bind(this)
				};
			directionalFn = diamondMap[this.motion.motionType as ShiftMotionType] ?? (() => []);
		} else {
			// BOX
			const boxMap: Record<ShiftMotionType, (x: number, y: number) => Array<[number, number]>> = {
				[PRO]: this._generate_box_pro_directional_tuples.bind(this),
				[ANTI]: this._generate_box_anti_directional_tuples.bind(this),
				[FLOAT]: this._generate_box_float_directional_tuples.bind(this)
			};
			directionalFn = boxMap[this.motion.motionType as ShiftMotionType] ?? (() => []);
		}

		return directionalFn(x, y);
	}

	private _generate_diamond_pro_directional_tuples(x: number, y: number): Array<[number, number]> {
		const directionMap: Record<string, Array<[number, number]>> = {
			[CLOCKWISE]: [
				[x, y],
				[-y, x],
				[-x, -y],
				[y, -x]
			],
			[COUNTER_CLOCKWISE]: [
				[-y, -x],
				[x, -y],
				[y, x],
				[-x, y]
			]
		};
		return directionMap[this.motion.propRotDir] ?? [];
	}

	private _generate_diamond_anti_directional_tuples(x: number, y: number): Array<[number, number]> {
		const directionMap: Record<string, Array<[number, number]>> = {
			[CLOCKWISE]: [
				[-y, -x],
				[x, -y],
				[y, x],
				[-x, y]
			],
			[COUNTER_CLOCKWISE]: [
				[x, y],
				[-y, x],
				[-x, -y],
				[y, -x]
			]
		};
		return directionMap[this.motion.propRotDir] ?? [];
	}

	private _generate_diamond_float_directional_tuples(
		x: number,
		y: number
	): Array<[number, number]> {
		// Python:
		// handpath_direction = self.hand_rot_dir_calculator.get_hand_rot_dir(self.motion.start_loc, self.motion.end_loc)
		const handpathDirection = this.handRotDirCalculator.getHandRotDir(
			this.motion.startLoc,
			this.motion.endLoc
		);

		const directionMap: Record<string, Array<[number, number]>> = {
			[CW_HANDPATH]: [
				[x, y],
				[-y, x],
				[-x, -y],
				[y, -x]
			],
			[CCW_HANDPATH]: [
				[-y, -x],
				[x, -y],
				[y, x],
				[-x, y]
			]
		};
		return handpathDirection ? directionMap[handpathDirection] : [];
	}

	private _generate_box_pro_directional_tuples(x: number, y: number): Array<[number, number]> {
		const directionMap: Record<string, Array<[number, number]>> = {
			[CLOCKWISE]: [
				[-x, y],
				[-y, -x],
				[x, -y],
				[y, x]
			],
			[COUNTER_CLOCKWISE]: [
				[x, y],
				[-y, x],
				[-x, -y],
				[y, -x]
			]
		};
		return directionMap[this.motion.propRotDir] ?? [];
	}

	private _generate_box_anti_directional_tuples(x: number, y: number): Array<[number, number]> {
		const directionMap: Record<string, Array<[number, number]>> = {
			[CLOCKWISE]: [
				[-x, y],
				[-y, -x],
				[x, -y],
				[y, x]
			],
			[COUNTER_CLOCKWISE]: [
				[x, y],
				[-y, x],
				[-x, -y],
				[y, -x]
			]
		};
		return directionMap[this.motion.propRotDir] ?? [];
	}

	private _generate_box_float_directional_tuples(x: number, y: number): Array<[number, number]> {
		const handpathDirection = this.handRotDirCalculator.getHandRotDir(
			this.motion.startLoc,
			this.motion.endLoc
		);
		const directionMap: Record<string, Array<[number, number]>> = {
			[CW_HANDPATH]: [
				[-y, -x],
				[x, -y],
				[y, x],
				[-x, y]
			],
			[CCW_HANDPATH]: [
				[-y, -x],
				[x, -y],
				[y, x],
				[-x, y]
			]
		};
		return handpathDirection ? directionMap[handpathDirection] : [];
	}
}
