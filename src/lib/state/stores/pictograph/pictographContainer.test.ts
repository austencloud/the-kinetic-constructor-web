/**
 * Tests for the pictograph container
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pictographContainer } from './pictographContainer';
import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import { PropType } from '$lib/types/Types';

describe('Pictograph Container', () => {
	// Reset the container before each test
	beforeEach(() => {
		pictographContainer.reset();
	});

	it('should have the correct initial state', () => {
		expect(pictographContainer.state.status).toBe('idle');
		expect(pictographContainer.state.data).toBeNull();
		expect(pictographContainer.state.error).toBeNull();
		expect(pictographContainer.state.loadProgress).toBe(0);
		expect(pictographContainer.state.components).toEqual({
			grid: false,
			redProp: false,
			blueProp: false,
			redArrow: false,
			blueArrow: false
		});
		expect(pictographContainer.state.stateHistory).toEqual([]);
	});

	it('should set data and transition to grid_loading', () => {
		pictographContainer.setData(defaultPictographData);

		expect(pictographContainer.state.status).toBe('grid_loading');
		expect(pictographContainer.state.data).toEqual(defaultPictographData);
		expect(pictographContainer.state.stateHistory.length).toBe(1);
		expect(pictographContainer.state.stateHistory[0].from).toBe('idle');
		expect(pictographContainer.state.stateHistory[0].to).toBe('initializing');
	});

	it('should update grid data and transition to props_loading', () => {
		// Set initial data
		pictographContainer.setData(defaultPictographData);

		// Create mock grid data
		const gridData: GridData = {
			allHandPointsStrict: {
				n: { coordinates: { x: 0, y: -100 } },
				e: { coordinates: { x: 100, y: 0 } },
				s: { coordinates: { x: 0, y: 100 } },
				w: { coordinates: { x: -100, y: 0 } }
			},
			allHandPointsNormal: {
				n: { coordinates: { x: 0, y: -90 } },
				e: { coordinates: { x: 90, y: 0 } },
				s: { coordinates: { x: 0, y: 90 } },
				w: { coordinates: { x: -90, y: 0 } }
			},
			allLayer2PointsStrict: {
				ne: { coordinates: { x: 100, y: -100 } },
				se: { coordinates: { x: 100, y: 100 } },
				sw: { coordinates: { x: -100, y: 100 } },
				nw: { coordinates: { x: -100, y: -100 } }
			},
			allLayer2PointsNormal: {
				ne: { coordinates: { x: 90, y: -90 } },
				se: { coordinates: { x: 90, y: 90 } },
				sw: { coordinates: { x: -90, y: 90 } },
				nw: { coordinates: { x: -90, y: -90 } }
			},
			allOuterPoints: {
				n_outer: { coordinates: { x: 0, y: -200 } },
				e_outer: { coordinates: { x: 200, y: 0 } },
				s_outer: { coordinates: { x: 0, y: 200 } },
				w_outer: { coordinates: { x: -200, y: 0 } }
			},
			centerPoint: { coordinates: { x: 0, y: 0 } }
		};

		// Update grid data
		pictographContainer.updateGridData(gridData);

		// Check state
		expect(pictographContainer.state.status).toBe('props_loading');
		expect(pictographContainer.state.data?.gridData).toEqual(gridData);
		expect(pictographContainer.state.components.grid).toBe(true);
		expect(pictographContainer.state.loadProgress).toBeGreaterThan(0);
	});

	it('should update prop data and transition to arrows_loading', () => {
		// Set initial data
		pictographContainer.setData(defaultPictographData);

		// Create mock prop data
		const propData: PropData = {
			id: 'test-prop',
			motionId: 'test-motion',
			propType: PropType.STAFF,
			color: 'red',
			radialMode: 'radial',
			ori: 'in',
			coords: { x: 50, y: 50 },
			loc: 'n',
			rotAngle: 0
		};

		// Update prop data
		pictographContainer.updatePropData('red', propData);

		// Check state
		expect(pictographContainer.state.status).toBe('arrows_loading');
		expect(pictographContainer.state.data?.redPropData).toEqual(propData);
		expect(pictographContainer.state.components.redProp).toBe(true);
	});

	it('should update arrow data', () => {
		// Set initial data
		pictographContainer.setData(defaultPictographData);

		// Create mock arrow data
		const arrowData: ArrowData = {
			id: 'test-arrow',
			motionId: 'test-motion',
			color: 'red',
			coords: { x: 50, y: 50 },
			loc: 'n',
			rotAngle: 0,
			svgMirrored: false,
			svgCenter: { x: 0, y: 0 },
			svgLoaded: false,
			svgData: null,
			motionType: 'static',
			startOri: 'in',
			endOri: 'in',
			turns: 0,
			propRotDir: 'cw'
		};

		// Update arrow data
		pictographContainer.updateArrowData('red', arrowData);

		// Check state
		expect(pictographContainer.state.data?.redArrowData).toEqual(arrowData);
		expect(pictographContainer.state.components.redArrow).toBe(true);
	});

	it('should set error state', () => {
		// Set error
		pictographContainer.setError('Test error', 'grid');

		// Check state
		expect(pictographContainer.state.status).toBe('error');
		expect(pictographContainer.state.error?.message).toBe('Test error');
		expect(pictographContainer.state.error?.component).toBe('grid');
		expect(pictographContainer.state.loadProgress).toBe(0);
	});

	it('should transition to complete when all components are loaded', () => {
		// Set initial data
		pictographContainer.setData(defaultPictographData);

		// Mark all components as loaded
		pictographContainer.updateComponentLoaded('grid');
		pictographContainer.updateComponentLoaded('redProp');
		pictographContainer.updateComponentLoaded('blueProp');
		pictographContainer.updateComponentLoaded('redArrow');
		pictographContainer.updateComponentLoaded('blueArrow');

		// Check state
		expect(pictographContainer.state.status).toBe('complete');
		expect(pictographContainer.state.loadProgress).toBe(100);
		expect(pictographContainer.state.components).toEqual({
			grid: true,
			redProp: true,
			blueProp: true,
			redArrow: true,
			blueArrow: true
		});
	});

	it('should reset to initial state', () => {
		// Set data and components
		pictographContainer.setData(defaultPictographData);
		pictographContainer.updateComponentLoaded('grid');

		// Reset
		pictographContainer.reset();

		// Check state
		expect(pictographContainer.state.status).toBe('idle');
		expect(pictographContainer.state.data).toBeNull();
		expect(pictographContainer.state.error).toBeNull();
		expect(pictographContainer.state.loadProgress).toBe(0);
		expect(pictographContainer.state.components).toEqual({
			grid: false,
			redProp: false,
			blueProp: false,
			redArrow: false,
			blueArrow: false
		});
		expect(pictographContainer.state.stateHistory).toEqual([]);
	});
});
