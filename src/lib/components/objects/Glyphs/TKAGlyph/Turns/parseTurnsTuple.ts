import type { DirRelation, PropRotDir, TKATurns } from '../../../../types/Types';

export const SAME = 's';
export const OPP = 'o';
export const CW = 'cw';
export const CCW = 'ccw';

const validTurnNums = [0, 0.5, 1, 1.5, 2, 2.5, 3];

export function parseTurnsTupleString(
	turnsStr: string
): [DirRelation | PropRotDir | null, TKATurns, TKATurns] {
	const cleaned = turnsStr.replace(/[()]/g, '').trim();
	const parts = cleaned.split(',').map((p) => p.trim());
	const [dirRaw, topRaw, bottomRaw] = parts;

	const direction = parseDirection(dirRaw);
	const topVal = parseTurnValue(topRaw);
	const bottomVal = parseTurnValue(bottomRaw);

	return [direction ?? null, topVal ?? 0, bottomVal ?? 0];
}

function parseDirection(item: string | null): DirRelation | PropRotDir | null {
	if (!item) return null;
	if (item === 's' || item === 'o' || item === 'cw' || item === 'ccw') {
		return item;
	}
	return null;
}

function parseTurnValue(item: string | null): TKATurns | null {
	if (!item) return null;
	if (item === 'fl') return 'fl';
	const num = Number(item);
	if (!isNaN(num) && validTurnNums.includes(num)) {
		return num as TKATurns;
	}
	return null;
}
