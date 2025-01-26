import { Letter } from '$lib/types/Letter';
import type { Motion } from '../../Motion/Motion';
import type { PictographGetter } from '../../PictographGetter';
import Arrow from '../Arrow.svelte';
import {
	RED,
	BLUE,
	NORTH,
	EAST,
	SOUTH,
	WEST,
	NORTHEAST,
	SOUTHEAST,
	SOUTHWEST,
	NORTHWEST,
	CLOCKWISE,
	COUNTER_CLOCKWISE,
	DIAMOND,
	BOX
} from '$lib/types/Constants';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '../../LetterUtils';

export default class DashLocationCalculator {
	private motion: Motion;
	private getter: PictographGetter;

	constructor(motion: Motion, getter: PictographGetter) {
		this.motion = motion;
		this.getter = getter;
	}

	calculateLocation(): string {
		const letterType = this.motion.letter
			? LetterType.getLetterType(this.motion.letter)
			: null;

		const letter = LetterUtils.getLetter(this.motion.letter);

		console.log('letterType', letterType);
		console.log('letter:', letter);

		// Handle Type3 specific logic
		if (letterType === LetterType.Type3 && this.motion.turns === 0) {
			return this._calculateDashLocationBasedOnShift();
		}
		if (
			letter &&
			[Letter.Φ_DASH, Letter.Ψ_DASH].includes(letter)
		) {
			return this._getPhiDashPsiDashLocation();
		}

		if (
			letter &&
			[Letter.Λ, Letter.Λ_DASH].includes(letter) &&
			this.motion.turns === 0
		) {
			return this._getLambdaZeroTurnsLocation();
		}

		if (this.motion.turns === 0) {
			return this._defaultZeroTurnsDashLocation();
		}

		return this._dashLocationNonZeroTurns();
	}

	private _getPhiDashPsiDashLocation(): string {
		const otherMotion = this.getter.getOtherMotion(this.motion);

		if (this.motion.turns === 0 && otherMotion && otherMotion.turns === 0) {
			const locationMap: { [key: string]: string } = {
				[`${RED}_${NORTH}_${SOUTH}`]: EAST,
				[`${RED}_${EAST}_${WEST}`]: NORTH,
				[`${RED}_${SOUTH}_${NORTH}`]: EAST,
				[`${RED}_${WEST}_${EAST}`]: NORTH,
				[`${BLUE}_${NORTH}_${SOUTH}`]: WEST,
				[`${BLUE}_${EAST}_${WEST}`]: SOUTH,
				[`${BLUE}_${SOUTH}_${NORTH}`]: WEST,
				[`${BLUE}_${WEST}_${EAST}`]: SOUTH,
				[`${RED}_${NORTHWEST}_${SOUTHEAST}`]: NORTHEAST,
				[`${RED}_${NORTHEAST}_${SOUTHWEST}`]: SOUTHEAST,
				[`${RED}_${SOUTHWEST}_${NORTHEAST}`]: SOUTHEAST,
				[`${RED}_${SOUTHEAST}_${NORTHWEST}`]: NORTHEAST,
				[`${BLUE}_${NORTHWEST}_${SOUTHEAST}`]: SOUTHWEST,
				[`${BLUE}_${NORTHEAST}_${SOUTHWEST}`]: NORTHWEST,
				[`${BLUE}_${SOUTHWEST}_${NORTHEAST}`]: NORTHWEST,
				[`${BLUE}_${SOUTHEAST}_${NORTHWEST}`]: SOUTHWEST
			};

			const key = `${this.motion.color}_${this.motion.startLoc}_${this.motion.endLoc}`;
			return locationMap[key] || '';
		}

		if (this.motion.turns === 0) {
			return (
				this.getOppositeLocation(this._dashLocationNonZeroTurns(otherMotion ?? undefined)) ?? ''
			);
		}

		return this._dashLocationNonZeroTurns(this.motion);
	}
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
	private _getLambdaZeroTurnsLocation(): string {
		const otherMotion = this.getter.getOtherMotion(this.motion);
		const locMap: { [key: string]: string } = {
			[`${NORTH}_${SOUTH}_${WEST}`]: EAST,
			[`${EAST}_${WEST}_${SOUTH}`]: NORTH,
			[`${NORTH}_${SOUTH}_${EAST}`]: WEST,
			[`${WEST}_${EAST}_${SOUTH}`]: NORTH,
			[`${SOUTH}_${NORTH}_${WEST}`]: EAST,
			[`${EAST}_${WEST}_${NORTH}`]: SOUTH,
			[`${SOUTH}_${NORTH}_${EAST}`]: WEST,
			[`${WEST}_${EAST}_${NORTH}`]: SOUTH,
			[`${NORTHEAST}_${SOUTHWEST}_${NORTHWEST}`]: SOUTHEAST,
			[`${NORTHWEST}_${SOUTHEAST}_${NORTHEAST}`]: SOUTHWEST,
			[`${SOUTHWEST}_${NORTHEAST}_${SOUTHEAST}`]: NORTHWEST,
			[`${SOUTHEAST}_${NORTHWEST}_${SOUTHWEST}`]: NORTHEAST,
			[`${NORTHEAST}_${SOUTHWEST}_${SOUTHEAST}`]: NORTHWEST,
			[`${NORTHWEST}_${SOUTHEAST}_${SOUTHWEST}`]: NORTHEAST,
			[`${SOUTHWEST}_${NORTHEAST}_${NORTHWEST}`]: SOUTHEAST,
			[`${SOUTHEAST}_${NORTHWEST}_${NORTHEAST}`]: SOUTHWEST
		};

		const key = `${this.motion.startLoc}_${this.motion.endLoc}_${otherMotion?.endLoc ?? ''}`;
		return locMap[key] || '';
	}

	private _defaultZeroTurnsDashLocation(): string {
		const locationMap: { [key: string]: string } = {
			[`${NORTH}_${SOUTH}`]: EAST,
			[`${EAST}_${WEST}`]: SOUTH,
			[`${SOUTH}_${NORTH}`]: WEST,
			[`${WEST}_${EAST}`]: NORTH,
			[`${NORTHEAST}_${SOUTHWEST}`]: SOUTHEAST,
			[`${NORTHWEST}_${SOUTHEAST}`]: NORTHEAST,
			[`${SOUTHWEST}_${NORTHEAST}`]: NORTHWEST,
			[`${SOUTHEAST}_${NORTHWEST}`]: SOUTHWEST
		};

		const key = `${this.motion.startLoc}_${this.motion.endLoc}`;
		return locationMap[key] || '';
	}

	private _dashLocationNonZeroTurns(motion = this.motion): string {
		const locMap: { [key: string]: { [key: string]: string } } = {
			[CLOCKWISE]: {
				[NORTH]: EAST,
				[EAST]: SOUTH,
				[SOUTH]: WEST,
				[WEST]: NORTH,
				[NORTHEAST]: SOUTHEAST,
				[SOUTHEAST]: SOUTHWEST,
				[SOUTHWEST]: NORTHWEST,
				[NORTHWEST]: NORTHEAST
			},
			[COUNTER_CLOCKWISE]: {
				[NORTH]: WEST,
				[EAST]: NORTH,
				[SOUTH]: EAST,
				[WEST]: SOUTH,
				[NORTHEAST]: NORTHWEST,
				[SOUTHEAST]: NORTHEAST,
				[SOUTHWEST]: SOUTHEAST,
				[NORTHWEST]: SOUTHWEST
			}
		};

		return locMap[motion.propRotDir]?.[motion.startLoc] || '';
	}
	private _calculateDashLocationBasedOnShift(): string {
		// if this.motion.motionType is pro, anti, or float, it's the shift, otherwise, the get other motion returns the shift
		const shiftMotion = this.getter.getShiftMotion();
		const dashMotion = shiftMotion ? this.getter.getOtherMotion(shiftMotion) : null;
		const shiftLocation = shiftMotion?.arrow?.loc ?? '';
		const dashStartLoc = dashMotion?.startLoc ?? '';
		const gridMode = this.motion.gridMode;

		console.log('shiftMotion', shiftMotion);
		console.log('dashMotion', dashMotion);
		console.log('shiftLocation', shiftLocation);
		console.log('dashStartLoc', dashStartLoc);
		console.log('gridMode', gridMode);



		const diamondDashLocationMap: Record<string, Record<string, string>> = {
			[NORTH]: { [NORTHWEST]: EAST, [NORTHEAST]: WEST, [SOUTHEAST]: WEST, [SOUTHWEST]: EAST },
			[EAST]: { [NORTHWEST]: SOUTH, [NORTHEAST]: SOUTH, [SOUTHEAST]: NORTH, [SOUTHWEST]: NORTH },
			[SOUTH]: { [NORTHWEST]: EAST, [NORTHEAST]: WEST, [SOUTHEAST]: WEST, [SOUTHWEST]: EAST },
			[WEST]: { [NORTHWEST]: SOUTH, [NORTHEAST]: SOUTH, [SOUTHEAST]: NORTH, [SOUTHWEST]: NORTH }
		};

		const boxDashLocationMap: Record<string, Record<string, string>> = {
			[NORTHEAST]: { [NORTH]: SOUTHEAST, [EAST]: NORTHWEST, [SOUTH]: NORTHWEST, [WEST]: SOUTHEAST },
			[SOUTHEAST]: { [NORTH]: SOUTHWEST, [EAST]: SOUTHWEST, [SOUTH]: NORTHEAST, [WEST]: NORTHEAST },
			[SOUTHWEST]: { [NORTH]: SOUTHEAST, [EAST]: NORTHWEST, [SOUTH]: NORTHWEST, [WEST]: SOUTHEAST },
			[NORTHWEST]: { [NORTH]: SOUTHWEST, [EAST]: SOUTHWEST, [SOUTH]: NORTHEAST, [WEST]: NORTHEAST }
		};

		if (gridMode === DIAMOND) {

			return diamondDashLocationMap[dashStartLoc][shiftLocation] || '';
		} else if (gridMode === BOX) {
			return boxDashLocationMap[dashStartLoc][shiftLocation] || '';
		}

		return '';
	}
}
