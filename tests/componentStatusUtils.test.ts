// src/lib/components/Pictograph/utils/__tests__/componentStatusUtils.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	checkAllComponentsLoaded,
	checkAllComponentsPositioned,
	determineNextStage,
	handleComponentError
} from '../src/lib/components/Pictograph/utils/componentStatusUtils';
import {
	DEFAULT_COMPONENT_LOADING,
	DEFAULT_COMPONENT_POSITIONING,
	type ComponentLoadingStatus,
	type ComponentPositioningStatus,
	type RenderStage
} from '../src/lib/components/Pictograph/constants/trackingConstants';

describe('componentStatusUtils', () => {
	// --- Tests for checkAllComponentsLoaded ---
	describe('checkAllComponentsLoaded', () => {
		it('should return false if no components are loaded', () => {
			const status: ComponentLoadingStatus = { ...DEFAULT_COMPONENT_LOADING };
			expect(checkAllComponentsLoaded(status)).toBe(false);
		});

		it('should return false if some components are loaded', () => {
			const status: ComponentLoadingStatus = {
				...DEFAULT_COMPONENT_LOADING,
				grid: true,
				redProp: true
			};
			expect(checkAllComponentsLoaded(status)).toBe(false);
		});

		it('should return true if all components are loaded', () => {
			const status: ComponentLoadingStatus = {
				grid: true,
				redProp: true,
				blueProp: true,
				redArrow: true,
				blueArrow: true
			};
			expect(checkAllComponentsLoaded(status)).toBe(true);
		});
	});

	// --- Tests for checkAllComponentsPositioned ---
	describe('checkAllComponentsPositioned', () => {
		it('should return false if no components are positioned', () => {
			const status: ComponentPositioningStatus = { ...DEFAULT_COMPONENT_POSITIONING };
			expect(checkAllComponentsPositioned(status)).toBe(false);
		});

		it('should return false if some components are positioned', () => {
			const status: ComponentPositioningStatus = {
				...DEFAULT_COMPONENT_POSITIONING,
				redProp: true
			};
			expect(checkAllComponentsPositioned(status)).toBe(false);
		});

		it('should return true if all components are positioned', () => {
			const status: ComponentPositioningStatus = {
				redProp: true,
				blueProp: true,
				redArrow: true,
				blueArrow: true
			};
			expect(checkAllComponentsPositioned(status)).toBe(true);
		});
	});

	// --- Tests for determineNextStage ---
	describe('determineNextStage', () => {
		const stages: RenderStage[] = [
			'initializing',
			'loading',
			'grid_ready',
			'components_ready',
			'positioning',
			'complete'
		];

		// Test cases structure: [currentStage, allLoaded, allPositioned, expectedNextStage]
		const testCases: [RenderStage, boolean, boolean, RenderStage][] = [
			// Not loaded, not positioned
			['initializing', false, false, 'initializing'],
			['loading', false, false, 'loading'],
			['grid_ready', false, false, 'grid_ready'],
			['components_ready', false, false, 'components_ready'], // Should not happen if logic is correct
			['positioning', false, false, 'positioning'], // Should not happen

			// All loaded, not positioned
			['initializing', true, false, 'initializing'], // Should transition elsewhere before this state
			['loading', true, false, 'components_ready'], // Key transition
			['grid_ready', true, false, 'components_ready'], // Key transition
			['components_ready', true, false, 'components_ready'], // Stays here
			['positioning', true, false, 'positioning'], // Stays here until positioned

			// All loaded, all positioned (should always go to complete)
			['initializing', true, true, 'complete'],
			['loading', true, true, 'complete'],
			['grid_ready', true, true, 'complete'],
			['components_ready', true, true, 'complete'],
			['positioning', true, true, 'complete'],
			['complete', true, true, 'complete'] // Stays complete
		];

		testCases.forEach(([current, loaded, positioned, expected]) => {
			it(`should return '${expected}' from '${current}' when loaded=${loaded}, positioned=${positioned}`, () => {
				expect(determineNextStage(current, loaded, positioned)).toBe(expected);
			});
		});
	});

	// --- Tests for handleComponentError ---
	describe('handleComponentError', () => {
		let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			// Spy on console.warn and provide a mock implementation to avoid cluttering test output
			consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		});

		afterEach(() => {
			// Restore the original implementation after each test
			vi.restoreAllMocks();
		});

		it('should mark the specified component as loaded and return a new status object', () => {
			const initialStatus: ComponentLoadingStatus = { ...DEFAULT_COMPONENT_LOADING };
			const componentKey: keyof ComponentLoadingStatus = 'redProp';

			const newStatus = handleComponentError(componentKey, initialStatus);

			// Check if the specific component is marked true
			expect(newStatus[componentKey]).toBe(true);

			// Check if other components remain false
			expect(newStatus.grid).toBe(false);
			expect(newStatus.blueProp).toBe(false);

			// Check if a new object was returned (immutability)
			expect(newStatus).not.toBe(initialStatus);
			expect(newStatus).toEqual({
				...initialStatus,
				[componentKey]: true
			});

			// Check if console.warn was called
			expect(consoleWarnSpy).toHaveBeenCalledOnce();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining(`Marked '${componentKey}' as loaded`)
			);
		});

		it('should handle error for the grid component', () => {
			const initialStatus: ComponentLoadingStatus = { ...DEFAULT_COMPONENT_LOADING };
			const newStatus = handleComponentError('grid', initialStatus);
			expect(newStatus.grid).toBe(true);
			expect(newStatus.redProp).toBe(false);
			expect(newStatus).not.toBe(initialStatus);
			expect(consoleWarnSpy).toHaveBeenCalledOnce();
		});

		it('should handle error for an arrow component', () => {
			const initialStatus: ComponentLoadingStatus = { ...DEFAULT_COMPONENT_LOADING };
			const newStatus = handleComponentError('blueArrow', initialStatus);
			expect(newStatus.blueArrow).toBe(true);
			expect(newStatus.redArrow).toBe(false);
			expect(newStatus).not.toBe(initialStatus);
			expect(consoleWarnSpy).toHaveBeenCalledOnce();
		});

		// Optional: Test handling of an invalid key (though current implementation doesn't explicitly check)
		// it('should not modify status if component key is invalid', () => {
		//     const initialStatus: ComponentLoadingStatus = { ...DEFAULT_COMPONENT_LOADING };
		//     const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		//     const newStatus = handleComponentError('invalidKey' as any, initialStatus);
		//     expect(newStatus).toEqual(initialStatus); // Status should be unchanged
		//     expect(newStatus).not.toBe(initialStatus); // Still returns a new object
		//     expect(consoleWarnSpy).not.toHaveBeenCalled();
		//     expect(consoleErrorSpy).toHaveBeenCalledOnce(); // Expect an error log
		//     consoleErrorSpy.mockRestore();
		// });
	});
});
