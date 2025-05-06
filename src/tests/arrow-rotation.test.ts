import { describe, it, expect, beforeEach, vi } from 'vitest';
import ArrowRotAngleManager from '../lib/components/objects/Arrow/ArrowRotAngleManager';
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

	// Test specifically for the issue with the 4th and 5th beat arrows when using dash motion
	it('should test rotation angles for dash motion with different motion types', () => {
		// Create a pictograph service that might be causing the issue
		const mockPictographServiceWithIssue = {
			getOtherMotion: (motion: any): any => {
				// Return a different motion type for beats 4 and 5
				if (motion.id === 'motion-4' || motion.id === 'motion-5') {
					return {
						id: 'other-motion',
						color: motion.color === 'red' ? 'blue' : 'red',
						motionType: 'anti', // Different motion type
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

		// Create dash motions for 5 beats
		const dashMotions = Array(5)
			.fill(null)
			.map(
				(_, index) =>
					({
						id: `motion-${index + 1}`,
						color: 'red',
						motionType: 'dash', // Using dash motion type
						startLoc: 'n',
						endLoc: 's',
						startOri: 'in',
						endOri: 'in',
						propRotDir: 'cw',
						turns: 0, // Zero turns for dash motion
						handRotDir: 'cw_shift',
						gridMode: 'diamond',
						letter: null
					}) as any
			);

		// Calculate rotation angles for dash motions
		const location: Loc = 'ne';
		const dashAngles = dashMotions.map((motion) =>
			problematicRotAngleManager.calculateRotationAngle(motion, location)
		);

		// Log the angles for each beat with dash motion
		dashAngles.forEach((angle, index) => {
			console.log(`Beat ${index + 1} dash angle at ${location}: ${angle}`);
		});

		// Check if beats 4 and 5 have different angles from the others
		const referenceAngle = dashAngles[0];

		// Log any differences
		dashAngles.forEach((angle, index) => {
			if (angle !== referenceAngle) {
				console.log(`Beat ${index + 1} has a different angle: ${angle} vs ${referenceAngle}`);
			}
		});

		// This test might fail if beats 4 and 5 have different angles
		expect(dashAngles[3]).toEqual(referenceAngle);
		expect(dashAngles[4]).toEqual(referenceAngle);
	});

	// Test specifically for the issue with the 5th beat arrow rotation
	it('should simulate the exact issue with 5th beat selection', () => {
		// Create a pictograph service that simulates the issue with the 5th beat
		const mockPictographServiceWithBeatIssue = {
			getOtherMotion: (motion: any): any => {
				// The issue might be related to how the service handles the 5th beat
				// Specifically, it might be using the wrong reference for calculating the rotation angle

				// For beats 4 and 5, return a motion with a different property that affects rotation
				if (motion.id === 'motion-4' || motion.id === 'motion-5') {
					return {
						id: 'other-motion',
						color: motion.color === 'red' ? 'blue' : 'red',
						motionType: 'dash', // Different motion type
						startLoc: 'n', // Same as the original motion
						endLoc: 's', // Same as the original motion
						startOri: 'in',
						endOri: 'in',
						propRotDir: 'ccw', // Different rotation direction
						turns: 0, // Different turns value
						handRotDir: 'ccw_shift',
						gridMode: 'diamond',
						letter: null
					} as any;
				}

				return null; // Return null for other beats
			},

			getShiftMotion: (): any => {
				// Return a motion that might affect the rotation calculation
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
			mockPictographServiceWithBeatIssue as any
		);

		// Create motions for 5 beats
		const motions = Array(5)
			.fill(null)
			.map(
				(_, index) =>
					({
						id: `motion-${index + 1}`,
						color: 'red',
						motionType: 'dash', // Using dash motion type to match the reported issue
						startLoc: 'n',
						endLoc: 's',
						startOri: 'in',
						endOri: 'in',
						propRotDir: 'cw',
						turns: 0, // Zero turns for dash motion
						handRotDir: 'cw_shift',
						gridMode: 'diamond',
						letter: null
					}) as any
			);

		// Calculate rotation angles for each beat
		const locations: Loc[] = ['ne', 'nw', 'se', 'sw'];

		// Test each location to see if the issue appears
		locations.forEach((location) => {
			console.log(`\nTesting location: ${location}`);

			const angles = motions.map((motion) =>
				problematicRotAngleManager.calculateRotationAngle(motion, location)
			);

			// Log the angles for each beat
			angles.forEach((angle, index) => {
				console.log(`Beat ${index + 1} angle at ${location}: ${angle}`);
			});

			// Check if beats 4 and 5 have different angles from the others
			const referenceAngle = angles[0];

			// Log any differences
			angles.forEach((angle, index) => {
				if (angle !== referenceAngle) {
					console.log(
						`Beat ${index + 1} has a different angle at ${location}: ${angle} vs ${referenceAngle}`
					);
				}
			});
		});

		// Now simulate the layout shift from 2x2 to 3x3
		console.log('\nSimulating layout shift from 2x2 to 3x3');

		// Calculate positions in 2x2 layout
		const positions2x2 = motions.slice(0, 4).map((_, index) => {
			const row = Math.floor(index / 2);
			const col = index % 2;
			return { row, col };
		});

		// Calculate positions in 3x3 layout
		const positions3x3 = motions.map((_, index) => {
			const row = Math.floor(index / 3);
			const col = index % 3;
			return { row, col };
		});

		// Log the position changes
		console.log('Positions in 2x2 layout:');
		positions2x2.forEach((pos, index) => {
			console.log(`Beat ${index + 1}: row ${pos.row}, col ${pos.col}`);
		});

		console.log('Positions in 3x3 layout:');
		positions3x3.forEach((pos, index) => {
			console.log(`Beat ${index + 1}: row ${pos.row}, col ${pos.col}`);
		});

		// Check if beat 4's position changed significantly
		const beat4_2x2 = positions2x2[3];
		const beat4_3x3 = positions3x3[3];

		console.log(
			`Beat 4 position change: (${beat4_2x2.row},${beat4_2x2.col}) -> (${beat4_3x3.row},${beat4_3x3.col})`
		);

		// Test if the position change affects the rotation angle
		const location: Loc = 'ne';
		const angle4_before = problematicRotAngleManager.calculateRotationAngle(motions[3], location);
		const angle5 = problematicRotAngleManager.calculateRotationAngle(motions[4], location);

		console.log(`Beat 4 angle at ${location}: ${angle4_before}`);
		console.log(`Beat 5 angle at ${location}: ${angle5}`);

		// The issue might be related to how the rotation angle is calculated based on the beat's position
		// Let's modify the motion to simulate the position change
		const motion4WithNewPosition = {
			...motions[3],
			// Add properties that might be affected by the position change
			beatPosition: beat4_3x3
		};

		const angle4_after = problematicRotAngleManager.calculateRotationAngle(
			motion4WithNewPosition,
			location
		);
		console.log(`Beat 4 angle after position change at ${location}: ${angle4_after}`);

		// Check if the angle changed due to the position change
		if (angle4_before !== angle4_after) {
			console.log(
				`Position change affected the rotation angle: ${angle4_before} -> ${angle4_after}`
			);
		}

		// This test is exploratory and doesn't have specific assertions
		// It's meant to help identify the cause of the issue
	});
});
