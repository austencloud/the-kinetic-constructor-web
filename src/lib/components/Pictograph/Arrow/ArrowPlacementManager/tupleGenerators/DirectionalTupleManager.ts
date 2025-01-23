// DirectionalTupleManager.ts
import { ShiftDirectionalGenerator } from './ShiftDirectionalGenerator';
import { DashDirectionalGenerator } from './DashDirectionalGenerator';
import { BaseDirectionalGenerator } from './BaseDirectionalGenerator';

import type { Motion } from '../../../Motion/Motion';
import { StaticDirectionalGenerator } from './StaticDirectionalGenrartor';
import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';

/**
 * The manager that picks which generator to use, like your Python code:
 *
 * if motion.motion_type in [PRO, ANTI, FLOAT] => ShiftDirectionalGenerator
 * elif dash => DashDirectionalGenerator
 * elif static => StaticDirectionalGenerator
 */
export class DirectionalTupleManager {
	private generator: BaseDirectionalGenerator | null = null;

	constructor(private motion: Motion) {
		this.generator = this._selectGenerator();
	}

	private _selectGenerator(): BaseDirectionalGenerator | null {
		switch (this.motion.motionType) {
			case PRO:
			case ANTI:
			case FLOAT:
				return new ShiftDirectionalGenerator(this.motion);
			case DASH:
				return new DashDirectionalGenerator(this.motion);
			case STATIC:
				return new StaticDirectionalGenerator(this.motion);
			default:
				console.error(`No directional tuple generator for motion type: ${this.motion.motionType}`);
				return null;
		}
	}

	public generateDirectionalTuples(x: number, y: number): Array<[number, number]> {
		if (!this.generator) return [];
		return this.generator.generateDirectionalTuples(x, y);
	}
}
