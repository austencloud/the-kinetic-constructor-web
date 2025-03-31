// src/lib/components/PlacementManagers/ArrowPlacementManager/directionTuples.ts
import {
	CLOCKWISE,
	COUNTER_CLOCKWISE,
	NO_ROT,
	DIAMOND,
	BOX,
	CW_HANDPATH,
	CCW_HANDPATH,
	ANTI,
	FLOAT,
	PRO
} from '$lib/types/Constants';

import type { GridMode, PropRotDir, Loc, ShiftHandRotDir, MotionType } from '$lib/types/Types';

// Types for clarity
export type DirectionTuple = [number, number];
export type DirectionTupleSet = DirectionTuple[];

// ====================================================
// STATIC MOTION DIRECTION TUPLES
// ====================================================

export function generateStaticDirectionTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	gridMode: GridMode
): DirectionTupleSet {
	// Handle no rotation case
	if (propRotDir === NO_ROT) {
		return [
			[x, y],
			[-x, -y],
			[-y, x],
			[y, -x]
		];
	}

	// Use the appropriate grid-specific tuple generator
	return gridMode === DIAMOND
		? generateStaticDiamondTuples(x, y, propRotDir)
		: generateStaticBoxTuples(x, y, propRotDir);
}

function generateStaticDiamondTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir
): DirectionTupleSet {
	const directionMap: Record<PropRotDir, DirectionTupleSet> = {
		[CLOCKWISE]: [
			[x, -y],
			[y, x],
			[-x, y],
			[-y, -x]
		],
		[COUNTER_CLOCKWISE]: [
			[-x, -y],
			[y, -x],
			[x, y],
			[-y, x]
		],
		[NO_ROT]: [] // Should never be used - included for type safety
	};

	return directionMap[propRotDir] ?? [];
}

function generateStaticBoxTuples(x: number, y: number, propRotDir: PropRotDir): DirectionTupleSet {
	const directionMap: Record<PropRotDir, DirectionTupleSet> = {
		[CLOCKWISE]: [
			[x, y],
			[-y, x],
			[-x, -y],
			[y, -x]
		],
		[COUNTER_CLOCKWISE]: [
			[-y, -x],
			[x, -y],
			[y, x],
			[-x, y]
		],
		[NO_ROT]: [] // Should never be used - included for type safety
	};

	return directionMap[propRotDir] ?? [];
}

// ====================================================
// DASH MOTION DIRECTION TUPLES
// ====================================================

export function generateDashDirectionTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	gridMode: GridMode,
	startOri: string
): DirectionTupleSet {
	// Handle no rotation case
	if (propRotDir === NO_ROT) {
		return [
			[x, -y],
			[y, x],
			[-x, y],
			[-y, -x]
		];
	}

	// Use the appropriate grid-specific tuple generator
	return gridMode === DIAMOND
		? generateDashDiamondTuples(x, y, propRotDir, startOri)
		: generateDashBoxTuples(x, y, propRotDir, startOri);
}

function generateDashDiamondTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	startOri: string
): DirectionTupleSet {
	if (propRotDir === CLOCKWISE) {
		return [
			[x, -y],
			[y, x],
			[-x, y],
			[-y, -x]
		];
	} else if (propRotDir === COUNTER_CLOCKWISE) {
		return [
			[-x, -y],
			[y, -x],
			[x, y],
			[-y, x]
		];
	}

	return [];
}

function generateDashBoxTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	startOri: string
): DirectionTupleSet {
	if (propRotDir === CLOCKWISE) {
		return [
			[-y, x],
			[-x, -y],
			[y, -x],
			[x, y]
		];
	} else if (propRotDir === COUNTER_CLOCKWISE) {
		return [
			[-x, y],
			[-y, -x],
			[x, -y],
			[y, x]
		];
	}

	return [];
}

// ====================================================
// SHIFT MOTION DIRECTION TUPLES
// ====================================================

export function generateShiftDirectionTuples(
	x: number,
	y: number,
	motionType: MotionType,
	propRotDir: PropRotDir,
	gridMode: GridMode,
	handRotDir: ShiftHandRotDir | null
): DirectionTupleSet {
	// Select the appropriate generator based on motion type
	switch (motionType) {
		case PRO:
			return generateProDirectionTuples(x, y, propRotDir, gridMode);
		case ANTI:
			return generateAntiDirectionTuples(x, y, propRotDir, gridMode);
		case FLOAT:
			return generateFloatDirectionTuples(x, y, handRotDir, gridMode);
		default:
			return [];
	}
}

function generateProDirectionTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	gridMode: GridMode
): DirectionTupleSet {
	if (gridMode === DIAMOND) {
		return generateProDiamondTuples(x, y, propRotDir);
	} else {
		return generateProBoxTuples(x, y, propRotDir);
	}
}

function generateProDiamondTuples(x: number, y: number, propRotDir: PropRotDir): DirectionTupleSet {
	const directionMap: Record<PropRotDir, DirectionTupleSet> = {
		[CLOCKWISE]: [
			[x, y],
			[-y, x],
			[-x, -y],
			[y, -x]
		],
		[COUNTER_CLOCKWISE]: [
			[-y, -x],
			[x, -y],
			[y, x],
			[-x, y]
		],
		[NO_ROT]: [] // Should never be used - included for type safety
	};

	return directionMap[propRotDir] ?? [];
}

function generateProBoxTuples(x: number, y: number, propRotDir: PropRotDir): DirectionTupleSet {
	const directionMap: Record<PropRotDir, DirectionTupleSet> = {
		[CLOCKWISE]: [
			[-x, y],
			[-y, -x],
			[x, -y],
			[y, x]
		],
		[COUNTER_CLOCKWISE]: [
			[x, y],
			[-y, x],
			[-x, -y],
			[y, -x]
		],
		[NO_ROT]: [] // Should never be used - included for type safety
	};

	return directionMap[propRotDir] ?? [];
}

function generateAntiDirectionTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	gridMode: GridMode
): DirectionTupleSet {
	if (gridMode === DIAMOND) {
		return generateAntiDiamondTuples(x, y, propRotDir);
	} else {
		return generateAntiBoxTuples(x, y, propRotDir);
	}
}

function generateAntiDiamondTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir
): DirectionTupleSet {
	const directionMap: Record<PropRotDir, DirectionTupleSet> = {
		[CLOCKWISE]: [
			[-y, -x],
			[x, -y],
			[y, x],
			[-x, y]
		],
		[COUNTER_CLOCKWISE]: [
			[x, y],
			[-y, x],
			[-x, -y],
			[y, -x]
		],
		[NO_ROT]: [] // Should never be used - included for type safety
	};

	return directionMap[propRotDir] ?? [];
}

function generateAntiBoxTuples(x: number, y: number, propRotDir: PropRotDir): DirectionTupleSet {
	const directionMap: Record<PropRotDir, DirectionTupleSet> = {
		[CLOCKWISE]: [
			[-x, y],
			[-y, -x],
			[x, -y],
			[y, x]
		],
		[COUNTER_CLOCKWISE]: [
			[x, y],
			[-y, x],
			[-x, -y],
			[y, -x]
		],
		[NO_ROT]: [] // Should never be used - included for type safety
	};

	return directionMap[propRotDir] ?? [];
}

function generateFloatDirectionTuples(
	x: number,
	y: number,
	handRotDir: ShiftHandRotDir | null,
	gridMode: GridMode
): DirectionTupleSet {
	if (!handRotDir) return [];

	// Based on previous implementation, return empty arrays
	return [];
}