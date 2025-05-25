// src/lib/components/Pictograph/utils/dataComparison.ts
import type { PictographData } from '$lib/types/PictographData';
import type { MotionData } from '../../objects/Motion/MotionData';
import { logger } from '$lib/core/logging';

/**
 * Safely compares two values, handling Svelte 5 state proxies and preventing infinite recursion
 *
 * @param a First value to compare
 * @param b Second value to compare
 * @param visited Set of visited objects to prevent circular references
 * @param depth Current recursion depth
 * @returns True if the values are equal, false otherwise
 */
export function safeCompare<T>(a: T, b: T, visited = new WeakSet(), depth = 0): boolean {
	// Prevent infinite recursion
	const MAX_DEPTH = 10;
	if (depth > MAX_DEPTH) {
		return true; // Assume equal if we go too deep
	}

	// Handle null/undefined cases
	if (a == null && b == null) return true;
	if (a == null || b == null) return false;

	// For primitives, convert to string to avoid proxy equality issues
	if (typeof a !== 'object' && typeof b !== 'object') {
		return String(a) === String(b);
	}

	// Reference equality check
	if (a === b) return true;

	// Handle circular references
	if (typeof a === 'object' && typeof b === 'object') {
		if (visited.has(a) || visited.has(b)) {
			return true; // Assume equal for circular references
		}

		// Add objects to visited set
		visited.add(a);
		visited.add(b);

		try {
			// Handle arrays
			if (Array.isArray(a) && Array.isArray(b)) {
				if (a.length !== b.length) return false;
				for (let i = 0; i < a.length; i++) {
					if (!safeCompare(a[i], b[i], visited, depth + 1)) return false;
				}
				return true;
			}

			// Don't compare arrays with non-arrays
			if (Array.isArray(a) || Array.isArray(b)) return false;

			// For regular objects, compare keys and values
			const aKeys = Object.keys(a || {});
			const bKeys = Object.keys(b || {});

			// If key counts differ, objects are not equal
			if (aKeys.length !== bKeys.length) return false;

			// Check if all keys in a exist in b with the same values
			for (const key of aKeys) {
				const aValue = (a as any)[key];
				const bValue = (b as any)[key];

				// Skip functions and symbols
				if (typeof aValue === 'function' || typeof bValue === 'function') {
					continue;
				}

				// Skip Svelte internal properties and potential circular references
				if (
					key === '$$' ||
					key === '$capture_state' ||
					key === '$inject_state' ||
					key.startsWith('$$') ||
					key.startsWith('$')
				) {
					continue;
				}

				// If key doesn't exist in b or values don't match, objects are not equal
				if (!(key in (b as object)) || !safeCompare(aValue, bValue, visited, depth + 1)) {
					return false;
				}
			}

			return true;
		} finally {
			// Clean up visited set for this comparison branch
			visited.delete(a);
			visited.delete(b);
		}
	}

	// Fallback for mixed types
	return String(a) === String(b);
}

/**
 * Simple comparison function for basic data types that avoids infinite recursion
 * This is safer to use in reactive contexts
 */
export function simpleCompare<T>(a: T, b: T): boolean {
	// Reference equality
	if (a === b) return true;

	// Handle null/undefined
	if (a == null && b == null) return true;
	if (a == null || b == null) return false;

	// For primitives
	if (typeof a !== 'object' && typeof b !== 'object') {
		return String(a) === String(b);
	}

	// For objects, only do shallow comparison of key properties
	if (typeof a === 'object' && typeof b === 'object') {
		// Arrays
		if (Array.isArray(a) && Array.isArray(b)) {
			return a.length === b.length && a.every((val, i) => val === b[i]);
		}

		// Don't compare arrays with non-arrays
		if (Array.isArray(a) || Array.isArray(b)) return false;

		// Objects - only compare enumerable properties at top level
		const aKeys = Object.keys(a || {});
		const bKeys = Object.keys(b || {});

		if (aKeys.length !== bKeys.length) return false;

		return aKeys.every((key) => {
			const aVal = (a as any)[key];
			const bVal = (b as any)[key];

			// Skip functions and Svelte internals
			if (typeof aVal === 'function' || key.startsWith('$')) {
				return true;
			}

			return aVal === bVal;
		});
	}

	return false;
}

/**
 * Interface for storing a snapshot of pictograph data for comparison
 * Contains only the essential fields needed for change detection
 */
export interface PictographDataSnapshot {
	letter?: string;
	gridMode?: string;
	startPos?: string;
	endPos?: string;
	direction?: string;
	redMotionData: MotionDataSnapshot | null;
	blueMotionData: MotionDataSnapshot | null;
}

/**
 * Interface for storing a snapshot of motion data for comparison
 * Contains only the essential fields needed for change detection
 */
export interface MotionDataSnapshot {
	id?: string;
	startLoc?: string;
	endLoc?: string;
	startOri?: string;
	endOri?: string;
	motionType?: string;
}

/**
 * Creates a snapshot of the pictograph data for safe comparison
 * Extracts only the essential fields to avoid circular references
 *
 * @param data The pictograph data to create a snapshot from
 * @returns A snapshot object containing only the essential fields
 */
export function createDataSnapshot(data: PictographData): PictographDataSnapshot {
	return {
		letter: data.letter || undefined,
		gridMode: data.gridMode || undefined,
		startPos: data.startPos || undefined,
		endPos: data.endPos || undefined,
		direction: data.direction || undefined,
		redMotionData: data.redMotionData
			? {
					id: data.redMotionData.id,
					startLoc: data.redMotionData.startLoc,
					endLoc: data.redMotionData.endLoc,
					startOri: data.redMotionData.startOri,
					endOri: data.redMotionData.endOri,
					motionType: data.redMotionData.motionType
				}
			: null,
		blueMotionData: data.blueMotionData
			? {
					id: data.blueMotionData.id,
					startLoc: data.blueMotionData.startLoc,
					endLoc: data.blueMotionData.endLoc,
					startOri: data.blueMotionData.startOri,
					endOri: data.blueMotionData.endOri,
					motionType: data.blueMotionData.motionType
				}
			: null
	};
}

/**
 * Compares the current pictograph data with a previous snapshot
 * to determine if there have been any meaningful changes
 *
 * @param newData The current pictograph data
 * @param lastSnapshot The previous snapshot to compare against
 * @returns True if there are meaningful changes, false otherwise
 */
export function hasDataChanged(
	newData: PictographData,
	lastSnapshot: PictographDataSnapshot | null
): boolean {
	// If this is the first time, always return true
	if (!lastSnapshot) {
		return true;
	}

	try {
		// Use simple comparison for snapshots to avoid infinite recursion
		const fieldsChanged =
			lastSnapshot.letter !== newData.letter ||
			lastSnapshot.gridMode !== newData.gridMode ||
			lastSnapshot.startPos !== newData.startPos ||
			lastSnapshot.endPos !== newData.endPos ||
			lastSnapshot.direction !== newData.direction ||
			compareMotionData('red', lastSnapshot, newData) ||
			compareMotionData('blue', lastSnapshot, newData);

		return fieldsChanged;
	} catch (error) {
		logger.warn('Error comparing pictograph data:', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		return true; // Assume changed on error to be safe
	}
}

/**
 * Helper function to compare motion data between a snapshot and current data
 *
 * @param color The color of the motion data to compare ('red' or 'blue')
 * @param lastSnapshot The previous snapshot to compare against
 * @param newData The current pictograph data
 * @returns True if there are meaningful changes, false otherwise
 */
function compareMotionData(
	color: 'red' | 'blue',
	lastSnapshot: PictographDataSnapshot,
	newData: PictographData
): boolean {
	const key = color === 'red' ? 'redMotionData' : 'blueMotionData';
	const oldMotion = lastSnapshot[key as keyof typeof lastSnapshot] as MotionDataSnapshot | null;
	const newMotion = newData[key as keyof typeof newData] as MotionData | null;

	// Check if both are null/undefined
	if (!oldMotion && !newMotion) return false;

	// If one exists and the other doesn't, changed
	if ((!oldMotion && newMotion) || (oldMotion && !newMotion)) return true;

	// Compare critical motion properties using simple equality
	if (oldMotion && newMotion) {
		return (
			oldMotion.id !== newMotion.id ||
			oldMotion.startLoc !== newMotion.startLoc ||
			oldMotion.endLoc !== newMotion.endLoc ||
			oldMotion.startOri !== newMotion.startOri ||
			oldMotion.endOri !== newMotion.endOri ||
			oldMotion.motionType !== newMotion.motionType
		);
	}

	return false;
}
/**
 * Checks if the pictograph data has the required motion data
 *
 * @param data The pictograph data to check
 * @returns True if the data has red or blue motion data, false otherwise
 */
export function hasRequiredMotionData(data: PictographData): boolean {
	return Boolean(data?.redMotionData || data?.blueMotionData);
}

/**
 * Creates a safe deep copy of an object, handling circular references
 * This is useful for debugging and for creating snapshots
 *
 * @param obj The object to copy
 * @param depth Current recursion depth (internal use)
 * @param seen Set of already seen objects (internal use)
 * @returns A deep copy of the object without circular references
 */
export function safeDeepCopy<T>(obj: T, depth: number = 0, seen: Set<any> = new Set()): T {
	// Maximum recursion depth to prevent stack overflow
	const MAX_DEPTH = 10;

	// If we've exceeded the maximum depth, return a placeholder
	if (depth > MAX_DEPTH) {
		return '[Max Depth Exceeded]' as unknown as T;
	}

	// Handle null/undefined
	if (obj === null || obj === undefined) {
		return obj;
	}

	// Handle primitives
	if (typeof obj !== 'object') {
		return obj;
	}

	// Handle circular references
	if (seen.has(obj)) {
		return '[Circular Reference]' as unknown as T;
	}

	// Add object to seen set
	seen.add(obj);

	// Handle arrays
	if (Array.isArray(obj)) {
		const copy: any[] = [];
		for (let i = 0; i < obj.length; i++) {
			copy[i] = safeDeepCopy(obj[i], depth + 1, seen);
		}
		return copy as unknown as T;
	}

	// Handle objects
	const copy: any = {};
	for (const key in obj) {
		// Skip functions, symbols, and internal properties
		if (
			typeof (obj as any)[key] === 'function' ||
			key === '$$' ||
			key === '$capture_state' ||
			key === '$inject_state' ||
			key.startsWith('__') ||
			key.startsWith('$')
		) {
			continue;
		}

		// Copy property
		copy[key] = safeDeepCopy((obj as any)[key], depth + 1, seen);
	}

	return copy as T;
}
