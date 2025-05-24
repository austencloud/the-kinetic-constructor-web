// tests/arrow-positioning/ArrowPositioningTests.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ArrowPlacementManager } from '$lib/components/objects/Arrow/ArrowPlacementManager';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { PictographData } from '$lib/types/PictographData';
// GridData type is used implicitly
// import type { GridData } from '$lib/components/objects/Grid/GridData';
import { Letter } from '$lib/types/Letter';
import { PictographChecker } from '$lib/components/Pictograph/services/PictographChecker';
import {
	initializeTestDataLoader,
	getTestPictographByLetter,
	resetTestData
} from '$lib/utils/tests/pictographTestHelpers';

// Mock data
const mockGridData = {
	allHandPointsNormal: {
		n_diamond_hand_point: { coordinates: { x: 475, y: 330 } },
		e_diamond_hand_point: { coordinates: { x: 620, y: 475 } },
		ne_diamond_hand_point: { coordinates: { x: 618, y: 331 } },
		se_diamond_hand_point: { coordinates: { x: 618, y: 619 } },
		sw_diamond_hand_point: { coordinates: { x: 332, y: 619 } },
		nw_diamond_hand_point: { coordinates: { x: 332, y: 331 } }
	},
	allHandPointsStrict: {},
	allLayer2PointsNormal: {
		ne_diamond_layer2_point: { coordinates: { x: 618, y: 331 } }
	},
	allLayer2PointsStrict: {},
	allOuterPoints: {},
	centerPoint: { coordinates: { x: 475, y: 475 } }
};

// Real pictograph data will be loaded in beforeEach
let testPictographData: PictographData;

const mockArrowData: ArrowData = {
	id: '123',
	motionId: '456',
	color: 'red',
	coords: { x: 0, y: 0 },
	loc: 'ne',
	rotAngle: 0,
	motionType: 'pro',
	startOri: 'in',
	endOri: 'in',
	turns: 0,
	propRotDir: 'cw',
	svgMirrored: false,
	svgCenter: { x: 0, y: 0 },
	svgLoaded: false,
	svgData: null
};

describe('ArrowPlacementManager', () => {
	let manager: ArrowPlacementManager;
	let mockChecker: PictographChecker;

	beforeEach(async () => {
		// Initialize test data loader with real CSV data
		await initializeTestDataLoader();

		// Get real pictograph data for Letter A
		const pictographA = await getTestPictographByLetter(Letter.A);
		if (!pictographA) {
			throw new Error('Failed to load test pictograph data for Letter A');
		}
		testPictographData = pictographA;

		mockChecker = new PictographChecker(testPictographData);
		manager = new ArrowPlacementManager({
			pictographData: testPictographData,
			gridData: mockGridData,
			checker: mockChecker
		});
	});

	afterEach(() => {
		resetTestData();
	});

	it('should properly calculate initial arrow position', () => {
		const arrows = [mockArrowData];
		manager.updateArrowPlacements(arrows);

		expect(arrows[0].coords.x).not.toBe(0);
		expect(arrows[0].coords.y).not.toBe(0);
	});

	// Test more specific scenarios
	it('should handle pro motion arrows correctly', () => {
		const proArrow = { ...mockArrowData, motionType: 'pro' as const };
		manager.updateArrowPlacements([proArrow]);
		// Assertions here
	});

	it('should handle anti motion arrows correctly', () => {
		const antiArrow = { ...mockArrowData, motionType: 'anti' as const };
		manager.updateArrowPlacements([antiArrow]);
		// Assertions here
	});
});
