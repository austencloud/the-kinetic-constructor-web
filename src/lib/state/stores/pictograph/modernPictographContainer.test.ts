/**
 * Tests for the modern pictograph container
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pictographContainer } from './modernPictographContainer';
import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import { PropType } from '$lib/types/Types';

describe('Modern Pictograph Container', () => {
	beforeEach(() => {
		// Reset the container before each test
		pictographContainer.reset();
	});

	it('should initialize with default state', () => {
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
		const mockGridData: GridData = {
			allHandPointsStrict: {},
			allHandPointsNormal: {},
			allLayer2PointsStrict: {},
			allLayer2PointsNormal: {},
			allOuterPoints: {},
			centerPoint: {
				coordinates: { x: 475, y: 475 }
			}
		};

		// Update grid data
		pictographContainer.updateGridData(mockGridData);

		// Check state
		expect(pictographContainer.state.status).toBe('props_loading');
		expect(pictographContainer.state.data?.gridData).toEqual(mockGridData);
		expect(pictographContainer.state.components.grid).toBe(true);
		expect(pictographContainer.state.stateHistory.length).toBe(2);
		expect(pictographContainer.state.stateHistory[1].from).toBe('grid_loading');
		expect(pictographContainer.state.stateHistory[1].to).toBe('props_loading');
	});

	it('should update prop data and transition to arrows_loading', () => {
		// Set initial data and grid data
		pictographContainer.setData(defaultPictographData);

		const mockGridData: GridData = {
			allHandPointsStrict: {},
			allHandPointsNormal: {},
			allLayer2PointsStrict: {},
			allLayer2PointsNormal: {},
			allOuterPoints: {},
			centerPoint: {
				coordinates: { x: 475, y: 475 }
			}
		};

		pictographContainer.updateGridData(mockGridData);

		// Create mock prop data
		const mockPropData: PropData = {
			id: 'test-prop',
			motionId: 'test-motion',
			color: 'red',
			propType: PropType.STAFF,
			ori: 'in',
			radialMode: 'radial',
			coords: { x: 100, y: 100 },
			loc: 'n',
			rotAngle: 0
		};

		// Update prop data
		pictographContainer.updatePropData('red', mockPropData);

		// Check state
		expect(pictographContainer.state.status).toBe('arrows_loading');
		expect(pictographContainer.state.data?.redPropData).toEqual(mockPropData);
		expect(pictographContainer.state.components.redProp).toBe(true);
		expect(pictographContainer.state.stateHistory.length).toBe(3);
		expect(pictographContainer.state.stateHistory[2].from).toBe('props_loading');
		expect(pictographContainer.state.stateHistory[2].to).toBe('arrows_loading');
	});

	it('should update arrow data', () => {
		// Set initial data, grid data, and prop data
		pictographContainer.setData(defaultPictographData);

		const mockGridData: GridData = {
			allHandPointsStrict: {},
			allHandPointsNormal: {},
			allLayer2PointsStrict: {},
			allLayer2PointsNormal: {},
			allOuterPoints: {},
			centerPoint: {
				coordinates: { x: 475, y: 475 }
			}
		};

		pictographContainer.updateGridData(mockGridData);

		const mockPropData: PropData = {
			id: 'test-prop',
			motionId: 'test-motion',
			color: 'red',
			propType: PropType.STAFF,
			ori: 'in',
			radialMode: 'radial',
			coords: { x: 100, y: 100 },
			loc: 'n',
			rotAngle: 0
		};

		pictographContainer.updatePropData('red', mockPropData);

		// Create mock arrow data
		const mockArrowData: ArrowData = {
			id: 'test-arrow',
			motionId: 'test-motion',
			color: 'red',
			coords: { x: 100, y: 100 },
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
		pictographContainer.updateArrowData('red', mockArrowData);

		// Check state
		expect(pictographContainer.state.data?.redArrowData).toEqual(mockArrowData);
		expect(pictographContainer.state.components.redArrow).toBe(true);
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

	it('should set error state', () => {
		// Set error
		pictographContainer.setError('Test error', 'test-component');

		// Check state
		expect(pictographContainer.state.status).toBe('error');
		expect(pictographContainer.state.error?.message).toBe('Test error');
		expect(pictographContainer.state.error?.component).toBe('test-component');
		expect(pictographContainer.state.loadProgress).toBe(0);
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
