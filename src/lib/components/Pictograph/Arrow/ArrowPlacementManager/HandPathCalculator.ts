// HandpathCalculator.ts

import {
	CCW_HANDPATH,
	CW_HANDPATH,
	DASH,
	STATIC,
	SOUTH,
	WEST,
	NORTH,
	EAST,
	NORTHEAST,
	NORTHWEST,
	SOUTHEAST,
	SOUTHWEST
} from '$lib/types/Constants';
import type { HandRotDir } from '../../Motion/MotionData';
import type { Loc } from '../../Prop/PropData';

export class HandpathCalculator {
	private handRotDirMap: Map<string, HandRotDir>;

	constructor() {
		const clockwisePairs: [Loc, Loc][] = [
			[SOUTH, WEST],
			[WEST, NORTH],
			[NORTH, EAST],
			[EAST, SOUTH]
		];
		const counterClockwisePairs: [Loc, Loc][] = [
			[WEST, SOUTH],
			[NORTH, WEST],
			[EAST, NORTH],
			[SOUTH, EAST]
		];
		const diagonalClockwise: [Loc, Loc][] = [
			[NORTHEAST, SOUTHEAST],
			[SOUTHEAST, SOUTHWEST],
			[SOUTHWEST, NORTHWEST],
			[NORTHWEST, NORTHEAST]
		];
		const diagonalCounterClockwise: [Loc, Loc][] = [
			[NORTHEAST, NORTHWEST],
			[NORTHWEST, SOUTHWEST],
			[SOUTHWEST, SOUTHEAST],
			[SOUTHEAST, NORTHEAST]
		];
		const dashPairs: [Loc, Loc][] = [
			[SOUTH, NORTH],
			[WEST, EAST],
			[NORTH, SOUTH],
			[EAST, WEST],
			[NORTHEAST, SOUTHWEST],
			[SOUTHEAST, NORTHWEST],
			[SOUTHWEST, NORTHEAST],
			[NORTHWEST, SOUTHEAST]
		];
		const staticPairs: [Loc, Loc][] = [
			[NORTH, NORTH],
			[EAST, EAST],
			[SOUTH, SOUTH],
			[WEST, WEST],
			[NORTHEAST, NORTHEAST],
			[SOUTHEAST, SOUTHEAST],
			[SOUTHWEST, SOUTHWEST],
			[NORTHWEST, NORTHWEST]
		];

		this.handRotDirMap = new Map<string, HandRotDir>([
			...clockwisePairs.map(
				(pair) => [`${pair[0]},${pair[1]}`, CW_HANDPATH] as [string, HandRotDir]
			),
			...counterClockwisePairs.map(
				(pair) => [`${pair[0]},${pair[1]}`, CCW_HANDPATH] as [string, HandRotDir]
			),
			...diagonalClockwise.map(
				(pair) => [`${pair[0]},${pair[1]}`, CW_HANDPATH] as [string, HandRotDir]
			),
			...diagonalCounterClockwise.map(
				(pair) => [`${pair[0]},${pair[1]}`, CCW_HANDPATH] as [string, HandRotDir]
			),
			...dashPairs.map((pair) => [`${pair[0]},${pair[1]}`, DASH] as [string, HandRotDir]),
			...staticPairs.map((pair) => [`${pair[0]},${pair[1]}`, STATIC] as [string, HandRotDir])
		]);
	}

	public getHandRotDir(startLoc: string, endLoc: string): HandRotDir {
		return this.handRotDirMap.get(`${startLoc},${endLoc}`) || null;
	}
}
