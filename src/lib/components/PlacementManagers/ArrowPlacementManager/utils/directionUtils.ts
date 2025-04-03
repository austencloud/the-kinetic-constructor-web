import {
	CLOCKWISE,
	COUNTER_CLOCKWISE,
	NO_ROT,
	DIAMOND,
	BOX,
	PRO,
	ANTI,
	FLOAT,
	DASH,
	STATIC,
	NORTHEAST,
	SOUTHEAST,
	SOUTHWEST,
	NORTHWEST,
	WEST,
	SOUTH,
	EAST,
	NORTH
} from '$lib/types/Constants';
import type { DirectionTupleSet, TupleMapDefinition } from '../types';
import type { GridMode, PropRotDir, MotionType, ShiftHandRotDir } from '$lib/types/Types';

const STATIC_DIAMOND_MAP: TupleMapDefinition = {
	[CLOCKWISE]: [
		[1, -1],
		[1, 1],
		[-1, 1],
		[-1, -1]
	],
	[COUNTER_CLOCKWISE]: [
		[-1, -1],
		[1, -1],
		[1, 1],
		[-1, 1]
	],
	[NO_ROT]: []
};

const STATIC_BOX_MAP: TupleMapDefinition = {
	[CLOCKWISE]: [
		[1, 1],
		[-1, 1],
		[-1, -1],
		[1, -1]
	],
	[COUNTER_CLOCKWISE]: [
		[-1, -1],
		[1, -1],
		[1, 1],
		[-1, 1]
	],
	[NO_ROT]: []
};

const DASH_DIAMOND_MAP: TupleMapDefinition = {
	[CLOCKWISE]: [
		[1, -1],
		[1, 1],
		[-1, 1],
		[-1, -1]
	],
	[COUNTER_CLOCKWISE]: [
		[-1, -1],
		[1, -1],
		[1, 1],
		[-1, 1]
	],
	[NO_ROT]: [
		[1, -1],
		[1, 1],
		[-1, 1],
		[-1, -1]
	]
};

const DASH_BOX_MAP: TupleMapDefinition = {
	[CLOCKWISE]: [
		[-1, 1],
		[-1, -1],
		[1, -1],
		[1, 1]
	],
	[COUNTER_CLOCKWISE]: [
		[-1, 1],
		[-1, -1],
		[1, -1],
		[1, 1]
	],
	[NO_ROT]: [
		[1, -1],
		[1, 1],
		[-1, 1],
		[-1, -1]
	]
};

const PRO_DIAMOND_MAP: TupleMapDefinition = {
	[CLOCKWISE]: [
		[1, 1],
		[-1, 1],
		[-1, -1],
		[1, -1]
	],
	[COUNTER_CLOCKWISE]: [
		[-1, -1],
		[1, -1],
		[1, 1],
		[-1, 1]
	],
	[NO_ROT]: []
};

const PRO_BOX_MAP: TupleMapDefinition = {
	[CLOCKWISE]: [
		[-1, 1],
		[-1, -1],
		[1, -1],
		[1, 1]
	],
	[COUNTER_CLOCKWISE]: [
		[1, 1],
		[-1, 1],
		[-1, -1],
		[1, -1]
	],
	[NO_ROT]: []
};

const ANTI_DIAMOND_MAP: TupleMapDefinition = {
	[CLOCKWISE]: [
		[-1, -1],
		[1, -1],
		[1, 1],
		[-1, 1]
	],
	[COUNTER_CLOCKWISE]: [
		[1, 1],
		[-1, 1],
		[-1, -1],
		[1, -1]
	],
	[NO_ROT]: []
};

const ANTI_BOX_MAP: TupleMapDefinition = {
	[CLOCKWISE]: [
		[-1, 1],
		[-1, -1],
		[1, -1],
		[1, 1]
	],
	[COUNTER_CLOCKWISE]: [
		[1, 1],
		[-1, 1],
		[-1, -1],
		[1, -1]
	],
	[NO_ROT]: []
};
export function getDirectionTuples(
	x: number,
	y: number,
	motionType: MotionType,
	propRotDir: PropRotDir,
	gridMode: GridMode,
	options?: { startOri?: string; handRotDir?: ShiftHandRotDir }
): DirectionTupleSet {
	// No rotation special case
	if (propRotDir === NO_ROT && motionType !== STATIC) {
		return [
			[x, -y],
			[y, x],
			[-x, y],
			[-y, -x]
		];
	}

	switch (motionType) {
		case STATIC:
			return getStaticTuples(x, y, propRotDir, gridMode);
		case DASH:
			return getDashTuples(x, y, propRotDir, gridMode);
		case PRO:
			return getProTuples(x, y, propRotDir, gridMode);
		case ANTI:
			return getAntiTuples(x, y, propRotDir, gridMode);
		case FLOAT:
			return getFloatTuples(x, y, options?.handRotDir, gridMode);
		default:
			return [];
	}
}

function getDashTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	gridMode: GridMode
): DirectionTupleSet {
	const dashMappings: Record<string, Record<PropRotDir, DirectionTupleSet>> = {
		[DIAMOND]: {
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
			[NO_ROT]: [
				[x, y],
				[-y, -x],
				[x, -y],
				[y, x]
			]
		},
		[BOX]: {
			[CLOCKWISE]: [
				[-y, x],
				[-x, -y],
				[y, -x],
				[x, y]
			],
			[COUNTER_CLOCKWISE]: [
				[-x, y],
				[-y, -x],
				[x, -y],
				[y, x]
			],
			[NO_ROT]: [
				[x, y],
				[-y, x],
				[-x, -y],
				[y, -x]
			]
		}
	};

	return (
		dashMappings[gridMode]?.[propRotDir] || [
			[x, y],
			[-x, -y],
			[-y, x],
			[y, -x]
		]
	);
}

function applyDirectionMap(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	map: TupleMapDefinition
): DirectionTupleSet {
	const tuples = map[propRotDir];
	if (!tuples?.length) return [];

	return tuples.map(([factorX, factorY]) => [x * factorX, y * factorY]);
}

function getStaticTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	gridMode: GridMode
): DirectionTupleSet {
	const map = gridMode === DIAMOND ? STATIC_DIAMOND_MAP : STATIC_BOX_MAP;
	return applyDirectionMap(x, y, propRotDir, map);
}

function getProTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	gridMode: GridMode
): DirectionTupleSet {
	const map = gridMode === DIAMOND ? PRO_DIAMOND_MAP : PRO_BOX_MAP;
	return applyDirectionMap(x, y, propRotDir, map);
}

function getAntiTuples(
	x: number,
	y: number,
	propRotDir: PropRotDir,
	gridMode: GridMode
): DirectionTupleSet {
	const map = gridMode === DIAMOND ? ANTI_DIAMOND_MAP : ANTI_BOX_MAP;
	return applyDirectionMap(x, y, propRotDir, map);
}

function getFloatTuples(
	x: number,
	y: number,
	handRotDir?: ShiftHandRotDir,
	gridMode?: GridMode
): DirectionTupleSet {
	return [];
}

export function getQuadrantIndex(
	arrow: { loc?: string; motionType: string },
	gridMode: GridMode
): number {
	const { loc = '', motionType } = arrow;

	if (gridMode === DIAMOND) {
		if ([STATIC, DASH].includes(motionType)) {
			switch (loc) {
				case 'n':
				case NORTH:
					return 0;
				case 'e':
				case EAST:
					return 1;
				case 's':
				case SOUTH:
					return 2;
				case 'w':
				case WEST:
					return 3;
				default:
					return 0;
			}
		}
	}

	// Existing logic for other cases remains the same
	if (gridMode === DIAMOND) {
		if ([PRO, ANTI, FLOAT].includes(motionType)) {
			switch (loc) {
				case 'ne':
				case NORTHEAST:
					return 0;
				case 'se':
				case SOUTHEAST:
					return 1;
				case 'sw':
				case SOUTHWEST:
					return 2;
				case 'nw':
				case NORTHWEST:
					return 3;
				default:
					return 0;
			}
		}
	} else if (gridMode === BOX) {
		if ([PRO, ANTI, FLOAT].includes(motionType)) {
			switch (loc) {
				case 'n':
				case NORTH:
					return 0;
				case 'e':
				case EAST:
					return 1;
				case 's':
				case SOUTH:
					return 2;
				case 'w':
				case WEST:
					return 3;
				default:
					return 0;
			}
		} else if ([STATIC, DASH].includes(motionType)) {
			switch (loc) {
				case 'ne':
				case NORTHEAST:
					return 0;
				case 'se':
				case SOUTHEAST:
					return 1;
				case 'sw':
				case SOUTHWEST:
					return 2;
				case 'nw':
				case NORTHWEST:
					return 3;
				default:
					return 0;
			}
		}
	}

	return 0;
}
