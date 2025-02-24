// StaticDirectionalGenerator.ts
import { BaseDirectionalGenerator } from './BaseDirectionalGenerator';
import type { Motion } from '../../../Motion/Motion';
import { CLOCKWISE, COUNTER_CLOCKWISE, DIAMOND, NO_ROT } from '$lib/types/Constants';

/**
 * Translates your Python StaticDirectionalGenerator
 */
export class StaticDirectionalGenerator extends BaseDirectionalGenerator {
	constructor(motion: Motion) {
		super(motion);
	}

	public generateDirectionalTuples(x: number, y: number): Array<[number, number]> {
		// If no rotation => special fallback
		if (this.motion.propRotDir === NO_ROT) {
			// Python returned: [(x, y), (-x, -y), (-y, x), (y, -x)]
			return [
				[x, y],
				[-x, -y],
				[-y, x],
				[y, -x]
			];
		}

		const gridMode = this._get_grid_mode();
		if (gridMode === DIAMOND) {
			return this._generate_diamond_tuples(x, y);
		} else {
			return this._generate_box_tuples(x, y);
		}
	}

	private _generate_diamond_tuples(x: number, y: number): Array<[number, number]> {
		const directionMap: Record<string, Array<[number, number]>> = {
			[CLOCKWISE]: [
				[x, -y],
				[y, x],
				[-x, y],
				[-y, -x]
			],
			[COUNTER_CLOCKWISE]: [
				[-x, -y],
				[y, -x],
				[x, y],
				[-y, x]
			]
		};
		return directionMap[this.motion.propRotDir] ?? [];
	}

	private _generate_box_tuples(x: number, y: number): Array<[number, number]> {
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
}
