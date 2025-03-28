// DirectionalTupleManager.ts
import { ShiftDirectionalGenerator } from './ShiftDirectionalGenerator';
import { DashDirectionalGenerator } from './DashDirectionalGenerator';
import { BaseDirectionalGenerator } from './BaseDirectionalGenerator';

import { StaticDirectionalGenerator } from './StaticDirectionalGenrartor';
import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { Motion } from '$lib/components/objects/Motion/Motion';

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
