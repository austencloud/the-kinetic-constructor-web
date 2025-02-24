import type { Motion } from '$lib/components/objects/Motion/Motion';
import { BOX, DIAMOND } from '$lib/types/Constants';
import type { GridMode } from '$lib/types/Types';
import { HandpathCalculator } from '../HandPathCalculator';

export abstract class BaseDirectionalGenerator {
	protected motion: Motion;
	protected otherMotion: Motion | null;
	protected handRotDirCalculator: HandpathCalculator;

	constructor(motion: Motion) {
		this.motion = motion;

		this.otherMotion = null;
		this.handRotDirCalculator = new HandpathCalculator();
	}

	public abstract generateDirectionalTuples(x: number, y: number): Array<[number, number]>;

	protected _get_grid_mode(): GridMode {
		const mode = this.motion.gridMode || DIAMOND;
		if (mode !== BOX && mode !== DIAMOND) return DIAMOND;
		return mode;
	}
}
