import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PropData } from '../src/lib/components/objects/Prop/PropData';
import type { Loc, PropType, Orientation, RadialMode, Color } from '$lib/types/Types';
import { applyFallbackPosition } from '../src/lib/components/Pictograph/utils/positionUtils';

// Mock constants for test verification
const BASE_POSITIONS: Record<Loc, { x: number; y: number }> = {
	n: { x: 475, y: 330 },
	e: { x: 620, y: 475 },
	s: { x: 475, y: 620 },
	w: { x: 330, y: 475 },
	ne: { x: 620, y: 330 },
	se: { x: 620, y: 620 },
	sw: { x: 330, y: 620 },
	nw: { x: 330, y: 330 }
};
const COLOR_OFFSETS: Record<'red' | 'blue', { x: number; y: number }> = {
	red: { x: 30, y: 0 },
	blue: { x: -30, y: 0 }
};
const DEFAULT_CENTER = { x: 475, y: 475 };

describe('positionUtils', () => {
	describe('applyFallbackPosition', () => {
		let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
		let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
		let mockProp: PropData;

		// Helper to create a PropData object with proper types
		function createTestProp(overrides: Partial<PropData> = {}): PropData {
			return {
				id: 'test-prop',
				propType: 'staff' as PropType,
				color: 'red' as Color,
				radialMode: 'radial' as RadialMode, // Use correct RadialMode type
				ori: 'in' as Orientation,
				coords: { x: 0, y: 0 },
				loc: 'n' as Loc,
				rotAngle: 0,
				motionId: 'test-motion',
				...overrides
			} as PropData;
		}

		beforeEach(() => {
			mockProp = createTestProp();
			consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('should apply position based on valid loc and red color offset', () => {
			mockProp.loc = 'e';
			mockProp.color = 'red';
			applyFallbackPosition(mockProp, 'red');

			const expectedX = BASE_POSITIONS.e.x + COLOR_OFFSETS.red.x;
			const expectedY = BASE_POSITIONS.e.y + COLOR_OFFSETS.red.y;

			expect(mockProp.coords).toEqual({ x: expectedX, y: expectedY });
			expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
			expect(consoleErrorSpy).not.toHaveBeenCalled();
		});

		it('should apply position based on valid loc and blue color offset', () => {
			mockProp.loc = 'sw';
			mockProp.color = 'blue';
			applyFallbackPosition(mockProp, 'blue');

			const expectedX = BASE_POSITIONS.sw.x + COLOR_OFFSETS.blue.x;
			const expectedY = BASE_POSITIONS.sw.y + COLOR_OFFSETS.blue.y;

			expect(mockProp.coords).toEqual({ x: expectedX, y: expectedY });
			expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
			expect(consoleErrorSpy).not.toHaveBeenCalled();
		});

		it('should apply center position with red offset if loc is invalid', () => {
			// Force invalid loc for test
			mockProp.loc = 'invalid_loc' as any;
			mockProp.color = 'red';
			applyFallbackPosition(mockProp, 'red');

			const expectedX = DEFAULT_CENTER.x + COLOR_OFFSETS.red.x;
			const expectedY = DEFAULT_CENTER.y + COLOR_OFFSETS.red.y;

			expect(mockProp.coords).toEqual({ x: expectedX, y: expectedY });
			expect(consoleWarnSpy).not.toHaveBeenCalled();
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		});

		it('should apply center position with blue offset if loc is null', () => {
			mockProp.loc = null as any; // Force null loc for test
			mockProp.color = 'blue';
			applyFallbackPosition(mockProp, 'blue');

			const expectedX = DEFAULT_CENTER.x + COLOR_OFFSETS.blue.x;
			const expectedY = DEFAULT_CENTER.y + COLOR_OFFSETS.blue.y;

			expect(mockProp.coords).toEqual({ x: expectedX, y: expectedY });
			expect(consoleWarnSpy).not.toHaveBeenCalled();
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		});

		it('should mutate the coords property of the passed prop object', () => {
			mockProp.loc = 'n';
			mockProp.color = 'red';
			const originalCoordsRef = mockProp.coords;

			applyFallbackPosition(mockProp, 'red');

			expect(mockProp.coords.x).not.toBe(0);
			expect(mockProp.coords.y).not.toBe(0);
			expect(mockProp.coords).not.toBe(originalCoordsRef);
		});
	});
});
