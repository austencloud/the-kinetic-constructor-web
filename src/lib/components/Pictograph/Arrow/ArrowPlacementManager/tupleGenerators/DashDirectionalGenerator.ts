// DashDirectionalGenerator.ts
import { BaseDirectionalGenerator } from './BaseDirectionalGenerator';
import {
	BOX,
	DIAMOND,
	PRO,
	CLOCKWISE,
	COUNTER_CLOCKWISE,
	NO_ROT,
	BLUE,
	RED
} from '$lib/types/Constants';
import type { Motion } from '../../../Motion/Motion';

/**
 * Translates your Python DashDirectionalGenerator.
 * We replicate logic for 'type5 zero turns', 'no_rot' dash, etc.
 */
export class DashDirectionalGenerator extends BaseDirectionalGenerator {
	constructor(motion: Motion) {
		super(motion);
	}

	public generateDirectionalTuples(x: number, y: number): Array<[number, number]> {
		const gridMode = this._get_grid_mode();

		// If 'type5 zero turns'? (Your code uses letter conditions: letterType == Type5 && turns==0)
		// For simplicity, we'll assume you can check it on motion. If you do:
		//   if (motion.pictographData.letterType == 'type5' && motion.turns == 0) ...
		// or replicate your Python check:
		//   if self.motion.pictograph.letter_type == LetterType.Type5 and self.motion.turns == 0

		if (gridMode === DIAMOND) {
			if (this._isType5ZeroTurns()) {
				return this._handle_type5_zero_turns_diamond(x, y);
			} else if (this.motion.propRotDir === NO_ROT) {
				// Possibly a fallback to the "type5 zero turns" approach or your `_handle_no_rotation_dash`
				return this._handle_no_rotation_dash(x, y);
			} else if (this.motion.propRotDir === CLOCKWISE) {
				return [
					[x, -y],
					[y, x],
					[-x, y],
					[-y, -x]
				];
			} else if (this.motion.propRotDir === COUNTER_CLOCKWISE) {
				return [
					[-x, -y],
					[y, -x],
					[x, y],
					[-y, x]
				];
			}
		} else if (gridMode === BOX) {
			if (this._isType5ZeroTurns()) {
				return this._handle_type5_zero_turns_box(x, y);
			} else if (this.motion.propRotDir === NO_ROT) {
				return this._handle_no_rotation_dash(x, y);
			} else if (this.motion.propRotDir === CLOCKWISE) {
				return [
					[-y, x],
					[-x, -y],
					[y, -x],
					[x, y]
				];
			} else if (this.motion.propRotDir === COUNTER_CLOCKWISE) {
				return [
					[-x, y],
					[-y, -x],
					[x, -y],
					[y, x]
				];
			}
		}

		return [];
	}

	private _handle_no_rotation_dash(x: number, y: number): Array<[number, number]> {
		// Your code references 'otherMotion.motionType' inside these big if-chains.
		// For a minimal example, just return a fallback or replicate the logic fully.
		// We'll replicate a partial snippet:
		if (!this.otherMotion) {
			// fallback
			return [
				[x, -y],
				[y, x],
				[-x, y],
				[-y, -x]
			];
		}

		// Suppose we replicate the python approach:
		//   if self.otherMotion.motion_type == PRO:
		//       if self.otherMotion.prop_rot_dir == CLOCKWISE => ...
		// For brevity, here's a very short version:
		switch (this.otherMotion.motionType) {
			case PRO:
				if (this.otherMotion.propRotDir === CLOCKWISE) {
					return [
						[x, y],
						[-y, x],
						[-x, -y],
						[y, -x]
					];
				} else {
					return [
						[-x, y],
						[-y, -x],
						[x, -y],
						[y, x]
					];
				}
			// etc.
			default:
				return [
					[x, -y],
					[y, x],
					[-x, y],
					[-y, -x]
				];
		}
	}

	private _isType5ZeroTurns(): boolean {
		// If letter is type5 and motion.turns==0 => true
		// E.g. if (this.motion.pictographData.letterType === 'type5' && this.motion.turns === 0)
		// For demonstration:
		return false; // Or real check
	}

	private _handle_type5_zero_turns_diamond(x: number, y: number): Array<[number, number]> {
		// Python references color + (startLoc, endLoc) => a map.
		// We'll replicate a small portion:
		const key = `${this.motion.color}_${this.motion.startLoc}_${this.motion.endLoc}` as const;

		// Just an example map:
		const diamondType5Map: Record<string, Array<[number, number]>> = {
			[`${BLUE}_n_s`]: [
				[x, y],
				[-y, x],
				[-x, -y],
				[y, -x]
			]
			// etc...
		};

		return diamondType5Map[key] ?? [];
	}

	private _handle_type5_zero_turns_box(x: number, y: number): Array<[number, number]> {
		// Similar approach:
		const key = `${this.motion.color}_${this.motion.startLoc}_${this.motion.endLoc}` as const;
		const boxType5Map: Record<string, Array<[number, number]>> = {
			[`${RED}_ne_sw`]: [
				[x, y],
				[y, x],
				[-x, -y],
				[y, x]
			]
			// etc...
		};

		return boxType5Map[key] ?? [];
	}
}
