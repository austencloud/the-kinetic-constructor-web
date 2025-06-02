// src/lib/components/PlacementManagers/ArrowPlacementManager/utils/positionCalculator.ts
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { ArrowPlacementConfig, Coordinates } from '../types';
import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';

/**
 * Gets the initial position for an arrow based on its type and location
 */
export function getInitialPosition(arrow: ArrowData, config: ArrowPlacementConfig): Coordinates {
	const { motionType } = arrow;
	const { pictographData, gridData } = config;

	// Early return for invalid motion types
	if (!motionType) {
		return { x: 0, y: 0 };
	}

	// Determine position based on motion type
	switch (motionType) {
		case PRO:
		case ANTI:
		case FLOAT:
			return getShiftCoordinates(arrow, pictographData, gridData);
		case STATIC:
		case DASH:
			return getStaticDashCoordinates(arrow, pictographData, gridData);
		default:
			return { x: 0, y: 0 };
	}
}

/**
 * Gets coordinates for shift-type motions (Pro, Anti, Float)
 */
function getShiftCoordinates(arrow: ArrowData, pictographData: any, gridData: any): Coordinates {
	// Validate arrow location
	if (!arrow.loc) {
		// Only log once per session to reduce console noise
		if (!getShiftCoordinates._loggedUndefinedLoc) {
			console.warn(`Arrow location is undefined. This may indicate motion data issues.`);
			getShiftCoordinates._loggedUndefinedLoc = true;
		}
		return { x: 0, y: 0 };
	}

	// Validate grid data
	if (!gridData?.allLayer2PointsNormal) {
		console.warn(`Grid data or allLayer2PointsNormal is missing for arrow ${arrow.id}`);
		return { x: 0, y: 0 };
	}

	const pointName = `${arrow.loc}_${pictographData.gridMode || 'diamond'}_layer2_point`;
	const point = gridData.allLayer2PointsNormal[pointName];

	if (!point?.coordinates) {
		// Only log detailed info once per missing point to reduce noise
		if (!getShiftCoordinates._loggedMissingPoints) {
			getShiftCoordinates._loggedMissingPoints = new Set();
		}
		if (!getShiftCoordinates._loggedMissingPoints.has(pointName)) {
			console.warn(`Shift coordinate for '${pointName}' not found.`);
			getShiftCoordinates._loggedMissingPoints.add(pointName);
		}
		return { x: 0, y: 0 };
	}

	return point.coordinates;
}

// Add static properties for logging control
(getShiftCoordinates as any)._loggedUndefinedLoc = false;
(getShiftCoordinates as any)._loggedMissingPoints = new Set();

/**
 * Gets coordinates for static or dash motions
 */
function getStaticDashCoordinates(
	arrow: ArrowData,
	pictographData: any,
	gridData: any
): Coordinates {
	// Validate arrow location
	if (!arrow.loc) {
		// Only log once per session to reduce console noise
		if (!getStaticDashCoordinates._loggedUndefinedLoc) {
			console.warn(
				`Arrow location is undefined for static/dash motion. This may indicate motion data issues.`
			);
			getStaticDashCoordinates._loggedUndefinedLoc = true;
		}
		return { x: 0, y: 0 };
	}

	// Validate grid data
	if (!gridData?.allHandPointsNormal) {
		console.warn(`Grid data or allHandPointsNormal is missing for arrow ${arrow.id}`);
		return { x: 0, y: 0 };
	}

	const pointName = `${arrow.loc}_${pictographData.gridMode || 'diamond'}_hand_point`;
	const point = gridData.allHandPointsNormal[pointName];

	if (!point?.coordinates) {
		// Only log detailed info once per missing point to reduce noise
		if (!getStaticDashCoordinates._loggedMissingPoints) {
			getStaticDashCoordinates._loggedMissingPoints = new Set();
		}
		if (!getStaticDashCoordinates._loggedMissingPoints.has(pointName)) {
			console.warn(`Static coordinate for '${pointName}' not found.`);
			getStaticDashCoordinates._loggedMissingPoints.add(pointName);
		}
		return { x: 0, y: 0 };
	}

	return point.coordinates;
}

// Add static properties for logging control
(getStaticDashCoordinates as any)._loggedUndefinedLoc = false;
(getStaticDashCoordinates as any)._loggedMissingPoints = new Set();
