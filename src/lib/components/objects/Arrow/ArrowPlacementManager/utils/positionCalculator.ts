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
		console.warn(`Arrow location is undefined. Arrow data:`, {
			id: arrow.id,
			motionId: arrow.motionId,
			motionType: arrow.motionType,
			color: arrow.color
		});
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
		console.warn(
			`Shift coordinate for '${pointName}' not found. Available points:`,
			Object.keys(gridData.allLayer2PointsNormal || {}).slice(0, 5)
		);
		return { x: 0, y: 0 };
	}

	return point.coordinates;
}

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
		console.warn(`Arrow location is undefined for static/dash motion. Arrow data:`, {
			id: arrow.id,
			motionId: arrow.motionId,
			motionType: arrow.motionType,
			color: arrow.color
		});
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
		console.warn(
			`Static coordinate for '${pointName}' not found. Available points:`,
			Object.keys(gridData.allHandPointsNormal || {}).slice(0, 5)
		);
		return { x: 0, y: 0 };
	}

	return point.coordinates;
}
