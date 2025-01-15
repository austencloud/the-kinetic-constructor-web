// turnsUtils.ts

/**
 * parseTurnsValue:
 *   - If "fl", returns -0.5
 *   - Otherwise parse as float
 */
export function parseTurnsValue(value: string | number): number {
	if (value === 'fl') return -0.5;
	return parseFloat(value.toString());
}

/**
 * displayTurnsValue:
 *   - If -0.5 => "fl"
 *   - Otherwise stringifies the number
 */
export function displayTurnsValue(n: number): string {
	if (n === -0.5) return 'fl';
	return String(n);
}
