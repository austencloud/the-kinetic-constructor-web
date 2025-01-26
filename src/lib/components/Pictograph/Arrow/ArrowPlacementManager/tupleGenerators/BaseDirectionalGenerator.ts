// BaseDirectionalGenerator.ts
import type { Motion } from '../../../Motion/Motion';
import { HandpathCalculator } from '../../../Motion/HandpathCalculator';
import { BOX, DIAMOND } from '$lib/types/Constants';
import type { GridMode } from '$lib/components/Pictograph/types/Types';

/**
 * Equivalent to the Python BaseDirectionalGenerator:
 *  - holds the `motion` (and optionally `otherMotion`)
 *  - has a `handRotDirCalculator`
 *  - implements `_get_grid_mode()`
 *  - has an abstract `generateDirectionalTuples(...)`
 */
export abstract class BaseDirectionalGenerator {
	protected motion: Motion;
	protected otherMotion: Motion | null;
	protected handRotDirCalculator: HandpathCalculator;

	constructor(motion: Motion) {
		this.motion = motion;
		// If you need to get "the other motion," do something like:
		// this.otherMotion = this.motion.pictographData.getOtherMotion(motion) ?? null;
		this.otherMotion = null; // or set it properly
		this.handRotDirCalculator = new HandpathCalculator();
	}

	public abstract generateDirectionalTuples(x: number, y: number): Array<[number, number]>;


	protected _get_grid_mode(): GridMode {
		// log the data
		const mode = this.motion.gridMode || DIAMOND;
		if (mode !== BOX && mode !== DIAMOND) return DIAMOND;
		return mode;
	}
}
