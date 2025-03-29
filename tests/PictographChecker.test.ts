import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CLOCK, COUNTER, IN, OUT } from '$lib/types/Constants';
import type { PictographData } from '$lib/types/PictographData';
import { LetterConditions } from '../src/lib/components/Pictograph/LetterConditions';
import { Letter } from '$lib/types/Letter';
import { PictographChecker } from '$lib/components/Pictograph/PictographChecker';

// Mock for LetterUtils
vi.mock('$lib/utils/LetterUtils', () => ({
	LetterUtils: {
		getLettersByCondition: (condition: LetterConditions) => {
			switch (condition) {
				case LetterConditions.ALPHA_ENDING:
					return ['A', 'B', 'C'];
				case LetterConditions.BETA_ENDING:
					return ['D', 'E', 'F'];
				case LetterConditions.GAMMA_ENDING:
					return ['G', 'H', 'I'];
				default:
					return [];
			}
		}
	}
}));

describe('PictographChecker', () => {
	let mockPictographData: PictographData;
	let checker: PictographChecker;

	beforeEach(() => {
		// Initialize with default mock data
		mockPictographData = {
			letter: null,
			redMotionData: {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'in',
				endOri: IN,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			},
			blueMotionData: {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'out',
				endOri: CLOCK,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			}
		} as PictographData;

		checker = new PictographChecker(mockPictographData);
	});

	describe('Letter condition methods', () => {
		it('should return true for endsWithAlpha when letter is in alpha ending list', () => {
			mockPictographData.letter = Letter.A;
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithAlpha()).toBe(true);
		});

		it('should return false for endsWithAlpha when letter is not in alpha ending list', () => {
			mockPictographData.letter = Letter.D;
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithAlpha()).toBe(false);
		});

		it('should return true for endsWithBeta when letter is in beta ending list', () => {
			mockPictographData.letter = Letter.E;
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithBeta()).toBe(true);
		});

		it('should return false for endsWithBeta when letter is not in beta ending list', () => {
			mockPictographData.letter = Letter.A;
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithBeta()).toBe(false);
		});

		it('should return true for endsWithGamma when letter is in gamma ending list', () => {
			mockPictographData.letter = Letter.G;
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithGamma()).toBe(true);
		});

		it('should return false for endsWithGamma when letter is not in gamma ending list', () => {
			mockPictographData.letter = Letter.A;
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithGamma()).toBe(false);
		});

		it('should return false for all ending checks when letter is null', () => {
			mockPictographData.letter = null;
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithAlpha()).toBe(false);
			expect(checker.endsWithBeta()).toBe(false);
			expect(checker.endsWithGamma()).toBe(false);
		});
	});

	describe('Motion orientation methods', () => {
		it('should return true for endsWithLayer3 when red is radial and blue is rotational', () => {
			mockPictographData.redMotionData = {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'in',
				endOri: IN,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			mockPictographData.blueMotionData = {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'out',
				endOri: CLOCK,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithLayer3()).toBe(true);
		});

		it('should return true for endsWithLayer3 when red is rotational and blue is radial', () => {
			mockPictographData.redMotionData = {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'clock',
				endOri: COUNTER,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			mockPictographData.blueMotionData = {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'out',
				endOri: OUT,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithLayer3()).toBe(true);
		});

		it('should return false for endsWithLayer3 when both are radial', () => {
			mockPictographData.redMotionData = {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'in',
				endOri: IN,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			mockPictographData.blueMotionData = {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'out',
				endOri: OUT,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithLayer3()).toBe(false);
		});

		it('should return false for endsWithLayer3 when both are rotational', () => {
			mockPictographData.redMotionData = {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'clock',
				endOri: CLOCK,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			mockPictographData.blueMotionData = {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'counter',
				endOri: COUNTER,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithLayer3()).toBe(false);
		});

		it('should return true for endsWithRadialOri when both are radial', () => {
			mockPictographData.redMotionData = {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'in',
				endOri: IN,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			mockPictographData.blueMotionData = {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'out',
				endOri: OUT,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithRadialOri()).toBe(true);
		});

		it('should return false for endsWithRadialOri when either is not radial', () => {
			mockPictographData.redMotionData = {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'clock',
				endOri: CLOCK,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			mockPictographData.blueMotionData = {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'out',
				endOri: OUT,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithRadialOri()).toBe(false);
		});

		it('should return true for endsWithNonRadialOri when both are rotational', () => {
			mockPictographData.redMotionData = {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'clock',
				endOri: CLOCK,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			mockPictographData.blueMotionData = {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'counter',
				endOri: COUNTER,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithNonRadialOri()).toBe(true);
		});

		it('should return false for endsWithNonRadialOri when either is radial', () => {
			mockPictographData.redMotionData = {
				id: 'red-motion-id',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'in',
				endOri: IN,
				propRotDir: 'cw',
				color: 'red',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			mockPictographData.blueMotionData = {
				id: 'blue-motion-id',
				motionType: 'anti',
				startLoc: 's',
				endLoc: 'n',
				startOri: 'counter',
				endOri: COUNTER,
				propRotDir: 'ccw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			};
			checker = new PictographChecker(mockPictographData);
			expect(checker.endsWithNonRadialOri()).toBe(false);
		});
	});
});
