// PictographGetter.ts

import type { PictographInterface } from '$lib/types/PictographInterface';
import {
	RED,
	BLUE,
	NORTH,
	SOUTH,
	EAST,
	WEST,
	NORTHEAST,
	SOUTHEAST,
	SOUTHWEST,
	NORTHWEST
} from '$lib/types/Constants';
import type { Motion } from './Motion/Motion';

/**
 * Example "PictographGetter" in TypeScript, mirroring your Python approach.
 *
 * This class expects that `pictographData` has references like `redMotionData` and `blueMotionData`,
 * each being used to instantiate a `Motion` object (or they are already `Motion`).
 *
 * For "getOtherMotion", we rely on a color property in `Motion`.
 * If `motion.color === 'red'`, we return `blueMotion`; if 'blue', return `redMotion`.
 */
export class PictographGetter {
	private pictographData: PictographInterface;

	// Possibly store direct references to "redMotion" and "blueMotion" if desired:
	private redMotion: Motion | null = null;
	private blueMotion: Motion | null = null;

	// Track if we've "initialized" everything
	public isInitialized = false;

	constructor(pictographData: PictographInterface) {
		this.pictographData = pictographData;

		// If your PictographInterface already has "redMotion" and "blueMotion" as actual Motion objects,
		// set them here. If it just has "redMotionData" or such, you may need to create them or store them differently.
		if (pictographData.redMotionData) {
			// In some setups, you might store the real Motion instance.
			// Or if you already have a "Motion" object, store it directly.
			this.redMotion = pictographData.redMotion;
		}
		if (pictographData.blueMotionData) {
			this.blueMotion = pictographData.blueMotion;
		}
	}



	/**
	 * Return whichever motion matches "color", e.g. "red" => redMotion
	 */
	public motionByColor(color: string): Motion | null {
		if (color === RED && this.redMotion) {
			return this.redMotion;
		}
		if (color === BLUE && this.blueMotion) {
			return this.blueMotion;
		}
		return null;
	}

	/**
	 * Return "the other" motion from the one passed in.
	 * If we pass in a red motion, return the blue one, and vice versa.
	 */
	public getOtherMotion(currentMotion: Motion): Motion | null {
		if (currentMotion.color === RED && this.blueMotion) {
			return this.blueMotion;
		}
		if (currentMotion.color === BLUE && this.redMotion) {
			return this.redMotion;
		}
		return null;
	}

	/**
	 * Example "oppositeLocation" method, if you need it:
	 */
	public getOppositeLocation(loc: string): string | null {
		const oppositeMap: Record<string, string> = {
			[NORTH]: SOUTH,
			[SOUTH]: NORTH,
			[EAST]: WEST,
			[WEST]: EAST,
			[NORTHEAST]: SOUTHWEST,
			[SOUTHWEST]: NORTHEAST,
			[SOUTHEAST]: NORTHWEST,
			[NORTHWEST]: SOUTHEAST
		};
		return oppositeMap[loc] ?? null;
	}

	// ... other methods from your Python code, as needed:
	// trailingMotion() { ... }
	// leadingMotion() { ... }
	// etc.
}
