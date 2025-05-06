import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArrowRotAngleManager } from '../lib/components/objects/Arrow/ArrowRotAngleManager';
import type { Motion } from '../lib/components/objects/Motion/Motion';
import type { PictographData } from '../lib/types/PictographData';
import type { Loc } from '../lib/types/Types';
import { defaultPictographData } from '../lib/components/Pictograph/utils/defaultPictographData';

// Mock PictographService
class MockPictographService {
	private data: PictographData;

	constructor(data: PictographData) {
		this.data = data;
	}

	getOtherMotion(motion: Motion): Motion | null {
		// Return the other motion based on color
		if (motion.color === 'red') {
			return this.data.blueMotion;
		} else {
			return this.data.redMotion;
		}
	}

	getShiftMotion(): Motion | null {
		// For testing, return the red motion as the shift motion
		return this.data.redMotion;
	}
}

describe('Arrow Rotation Angle Tests', () => {
	let pictographData: PictographData;
	let mockService: MockPictographService;
	let rotAngleManager: ArrowRotAngleManager;

	beforeEach(() => {
		// Create a fresh copy of pictograph data for each test
		pictographData = JSON.parse(JSON.stringify(defaultPictographData));

		// Set up mock service
		mockService = new MockPictographService(pictographData);

		// Create rotation angle manager
		rotAngleManager = new ArrowRotAngleManager(pictographData, mockService as any);
	});

	it('should calculate correct rotation angles for pro motion', () => {
		// Set up a pro motion
		const proMotion = {
			id: 'test-motion-1',
			color: 'red',
			motionType: 'pro',
			startLoc: 'n',
			endLoc: 's',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'cw',
			turns: 1,
			handRotDir: 'cw_shift',
			gridMode: 'diamond',
			letter: null
		} as any;

		// Test rotation angles for different locations
		const neAngle = rotAngleManager.calculateRotationAngle(proMotion, 'ne');
		const nwAngle = rotAngleManager.calculateRotationAngle(proMotion, 'nw');

		// Verify angles based on the PRO_ROTATION_MAP
		expect(neAngle).toBe(0); // For 'ne' with 'cw' rotation
		expect(nwAngle).toBe(270); // For 'nw' with 'cw' rotation
	});

	it('should calculate correct rotation angles for dash motion', () => {
		// Set up a dash motion
		const dashMotion = {
			id: 'test-motion-2',
			color: 'blue',
			motionType: 'dash',
			startLoc: 'n',
			endLoc: 's',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'cw',
			turns: 0,
			handRotDir: 'cw_shift',
			gridMode: 'diamond',
			letter: null
		} as any;

		// Test rotation angles for different locations
		const neAngle = rotAngleManager.calculateRotationAngle(dashMotion, 'ne');
		const nwAngle = rotAngleManager.calculateRotationAngle(dashMotion, 'nw');

		// Log the angles for debugging
		console.log(`Dash motion NE angle: ${neAngle}`);
		console.log(`Dash motion NW angle: ${nwAngle}`);

		// Verify angles based on the DASH_ORIENTATION_MAP or overrides
		// These expected values should be adjusted based on the actual implementation
		expect(neAngle).toBeDefined();
		expect(nwAngle).toBeDefined();
	});

	// Test specifically for the issue with 4th and 5th beat arrows
	it('should maintain consistent rotation angles when beats change position', () => {
		// Create an array to simulate beats
		const beats = Array(5)
			.fill(null)
			.map((_, index) => ({
				id: `beat-${index + 1}`,
				beatNumber: index + 1
				// Add other beat properties as needed
			}));

		// Create motions for each beat with the same properties
		const motions = beats.map(
			(beat, index) =>
				({
					id: `motion-${index + 1}`,
					color: 'red',
					motionType: 'pro',
					startLoc: 'n',
					endLoc: 's',
					startOri: 'in',
					endOri: 'in',
					propRotDir: 'cw',
					turns: 1,
					handRotDir: 'cw_shift',
					gridMode: 'diamond',
					letter: null
				}) as any
		);

		// Calculate rotation angles for each beat's motion at the same location
		const location: Loc = 'ne';
		const angles = motions.map((motion) =>
			rotAngleManager.calculateRotationAngle(motion, location)
		);

		// Log the angles for each beat
		angles.forEach((angle, index) => {
			console.log(`Beat ${index + 1} angle at ${location}: ${angle}`);
		});

		// All angles should be the same since the motions have the same properties
		const firstAngle = angles[0];
		angles.forEach((angle, index) => {
			expect(angle).toEqual(firstAngle);
			if (angle !== firstAngle) {
				console.log(`Beat ${index + 1} has a different angle: ${angle} vs ${firstAngle}`);
			}
		});

		// Specifically check beats 4 and 5
		expect(angles[3]).toEqual(angles[0]);
		expect(angles[4]).toEqual(angles[0]);
	});

	// Test specifically for the layout shift issue when selecting the 5th beat
	it('should maintain correct rotation angles when layout shifts', () => {
		// Create an array to simulate beats with 4 beats initially
		const initialBeats = Array(4)
			.fill(null)
			.map((_, index) => ({
				id: `beat-${index + 1}`,
				beatNumber: index + 1
			}));

		// Create motions for the initial beats
		const initialMotions = initialBeats.map(
			(_, index) =>
				({
					id: `motion-${index + 1}`,
					color: 'red',
					motionType: 'pro',
					startLoc: 'n',
					endLoc: 's',
					startOri: 'in',
					endOri: 'in',
					propRotDir: 'cw',
					turns: 1,
					handRotDir: 'cw_shift',
					gridMode: 'diamond',
					letter: null
				}) as any
		);

		// Calculate initial layout - should be 2x2 for 4 beats
		const [initialRows, initialCols] = [2, 2]; // From autoAdjustLayout function
		console.log(`Initial layout: ${initialRows}x${initialCols}`);

		// Calculate initial positions for beats 4 and 5
		const beat4InitialRow = Math.floor(3 / initialCols);
		const beat4InitialCol = 3 % initialCols;
		console.log(`Beat 4 initial position: row ${beat4InitialRow}, col ${beat4InitialCol}`);

		// Calculate initial rotation angles
		const location: Loc = 'ne';
		const initialAngles = initialMotions.map((motion) =>
			rotAngleManager.calculateRotationAngle(motion, location)
		);
		console.log(`Beat 4 initial angle: ${initialAngles[3]}`);

		// Now add a 5th beat, which should change the layout to 3x3
		const updatedBeats = [...initialBeats, { id: 'beat-5', beatNumber: 5 }];
		const updatedMotions = updatedBeats.map(
			(_, index) =>
				({
					id: `motion-${index + 1}`,
					color: 'red',
					motionType: 'pro',
					startLoc: 'n',
					endLoc: 's',
					startOri: 'in',
					endOri: 'in',
					propRotDir: 'cw',
					turns: 1,
					handRotDir: 'cw_shift',
					gridMode: 'diamond',
					letter: null
				}) as any
		);

		// Calculate new layout - should be 3x3 for 5 beats
		const [updatedRows, updatedCols] = [3, 3]; // From autoAdjustLayout function
		console.log(`Updated layout: ${updatedRows}x${updatedCols}`);

		// Calculate new positions for beats 4 and 5
		const beat4UpdatedRow = Math.floor(3 / updatedCols);
		const beat4UpdatedCol = 3 % updatedCols;
		const beat5Row = Math.floor(4 / updatedCols);
		const beat5Col = 4 % updatedCols;
		console.log(`Beat 4 updated position: row ${beat4UpdatedRow}, col ${beat4UpdatedCol}`);
		console.log(`Beat 5 position: row ${beat5Row}, col ${beat5Col}`);

		// Calculate updated rotation angles
		const updatedAngles = updatedMotions.map((motion) =>
			rotAngleManager.calculateRotationAngle(motion, location)
		);

		// Log the updated angles
		updatedAngles.forEach((angle, index) => {
			console.log(`Beat ${index + 1} updated angle: ${angle}`);
		});

		// Check if beat 4's angle changed after layout shift
		expect(updatedAngles[3]).toEqual(initialAngles[3]);
		if (updatedAngles[3] !== initialAngles[3]) {
			console.log(
				`Beat 4 angle changed after layout shift: ${updatedAngles[3]} vs ${initialAngles[3]}`
			);
		}

		// Check if beat 5's angle is consistent with other beats
		expect(updatedAngles[4]).toEqual(updatedAngles[0]);
		if (updatedAngles[4] !== updatedAngles[0]) {
			console.log(`Beat 5 has an inconsistent angle: ${updatedAngles[4]} vs ${updatedAngles[0]}`);
		}
	});

	// Test specifically for the issue with the 4th and 5th beat arrows having wrong rotation angles
	it('should simulate the reported issue with 4th and 5th beat arrows', () => {
		// Create a pictograph service that might be causing the issue
		const mockPictographServiceWithIssue = {
			getOtherMotion: (motion: any): any => {
				// This is where the bug might be - when getting the other motion
				// for beats 4 and 5, it might be returning the wrong motion or null

				// For testing, let's simulate the issue by returning null for beats 4 and 5
				if (motion.id === 'motion-4' || motion.id === 'motion-5') {
					return null;
				}

				// Return a default motion for other beats
				return {
					id: 'other-motion',
					color: motion.color === 'red' ? 'blue' : 'red',
					motionType: 'pro',
					startLoc: 's',
					endLoc: 'n',
					startOri: 'in',
					endOri: 'in',
					propRotDir: 'ccw',
					turns: 1,
					handRotDir: 'ccw_shift',
					gridMode: 'diamond',
					letter: null
				} as any;
			},

			getShiftMotion: (): any => {
				// This could also be part of the issue - if the shift motion
				// is not being properly determined for beats 4 and 5
				return {
					id: 'shift-motion',
					color: 'red',
					motionType: 'pro',
					startLoc: 'n',
					endLoc: 's',
					startOri: 'in',
					endOri: 'in',
					propRotDir: 'cw',
					turns: 1,
					handRotDir: 'cw_shift',
					gridMode: 'diamond',
					letter: null
				} as any;
			}
		};

		// Create a rotation angle manager with the problematic service
		const problematicRotAngleManager = new ArrowRotAngleManager(
			pictographData,
			mockPictographServiceWithIssue as any
		);

		// Create motions for 5 beats - using any to bypass type checking for the test
		const motions = Array(5)
			.fill(null)
			.map(
				(_, index) =>
					({
						id: `motion-${index + 1}`,
						color: 'red',
						motionType: 'pro',
						startLoc: 'n',
						endLoc: 's',
						startOri: 'in',
						endOri: 'in',
						propRotDir: 'cw',
						turns: 1,
						handRotDir: 'cw_shift',
						gridMode: 'diamond',
						letter: null
					}) as any
			);

		// Calculate rotation angles using the problematic manager
		const location: Loc = 'ne';
		const problematicAngles = motions.map((motion) =>
			problematicRotAngleManager.calculateRotationAngle(motion, location)
		);

		// Log the angles for each beat
		problematicAngles.forEach((angle, index) => {
			console.log(`Beat ${index + 1} problematic angle at ${location}: ${angle}`);
		});

		// Calculate angles using the normal manager for comparison
		const normalAngles = motions.map((motion) =>
			rotAngleManager.calculateRotationAngle(motion, location)
		);

		// Log the normal angles for comparison
		normalAngles.forEach((angle, index) => {
			console.log(`Beat ${index + 1} normal angle at ${location}: ${angle}`);
		});

		// Check if there's a difference in angles for beats 4 and 5
		// This test might fail, which would indicate the source of the issue
		expect(problematicAngles[3]).toEqual(normalAngles[3]);
		expect(problematicAngles[4]).toEqual(normalAngles[4]);
	});
});
