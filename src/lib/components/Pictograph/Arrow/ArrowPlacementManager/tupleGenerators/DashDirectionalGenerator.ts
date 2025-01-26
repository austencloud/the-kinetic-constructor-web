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

export class DashDirectionalGenerator extends BaseDirectionalGenerator {
	constructor(motion: Motion) {
		super(motion);
	}

	public generateDirectionalTuples(x: number, y: number): Array<[number, number]> {
		const gridMode = this._get_grid_mode();

		if (gridMode === DIAMOND) {
			if (this._isType5ZeroTurns()) {
				return this._handle_type5_zero_turns_diamond(x, y);
			} else if (this.motion.propRotDir === NO_ROT) {
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
		if (!this.otherMotion) {
			return [
				[x, -y],
				[y, x],
				[-x, y],
				[-y, -x]
			];
		}

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
		return false;
	}

	private _handle_type5_zero_turns_diamond(x: number, y: number): Array<[number, number]> {
		const key = `${this.motion.color}_${this.motion.startLoc}_${this.motion.endLoc}` as const;
		const diamondType5Map: Record<string, Array<[number, number]>> = {
			[`${BLUE}_n_s`]: [
				[x, y],
				[-y, x],
				[-x, -y],
				[y, -x]
			]
		};

		return diamondType5Map[key] ?? [];
	}

	private _handle_type5_zero_turns_box(x: number, y: number): Array<[number, number]> {
		const key = `${this.motion.color}_${this.motion.startLoc}_${this.motion.endLoc}` as const;
		const boxType5Map: Record<string, Array<[number, number]>> = {
			[`${RED}_ne_sw`]: [
				[x, y],
				[y, x],
				[-x, -y],
				[y, x]
			]
		};

		return boxType5Map[key] ?? [];
	}
}
