// BaseDirectionalGenerator.ts
import type { Motion } from '../../../Motion/Motion';
import { HandpathCalculator } from '../../../Motion/HandpathCalculator';
import { BOX, DIAMOND } from '$lib/types/Constants';
import type { GridMode } from '$lib/types/PictographInterface';

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

	/**
	 * In Python, you wrote:
	 *   if self.motion.prop.loc in ["ne", "nw", "se", "sw"]: => BOX
	 *   elif in ["n", "s", "e", "w"]: => DIAMOND
	 *
	 * Adapt as needed. We'll assume you store `gridMode` in motion.pictographData.gridMode.
	 */
	protected _get_grid_mode(): GridMode {
		// If you want to replicate the Python approach exactly:
		// if (this.motion.startLoc in [NE, NW, SE, SW]) ...
		// But usually you already have a gridMode on the pictographData:
		const mode = this.motion.pictographData.gridMode || DIAMOND;
		if (mode !== BOX && mode !== DIAMOND) return DIAMOND;
		return mode;
	}
}
