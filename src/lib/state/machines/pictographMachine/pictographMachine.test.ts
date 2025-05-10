/**
 * Tests for the pictograph state machine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { pictographMachineContainer } from './pictographMachine';
import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import { PropType } from '$lib/types/Types';

describe('Pictograph Machine', () => {
	beforeEach(() => {
		// Reset the machine before each test
		pictographMachineContainer.send({ type: 'RESET' });
	});

	it('should initialize with idle state', () => {
		const state = pictographMachineContainer.getSnapshot();

		expect(state.value).toBe('idle');
		expect(state.context.status).toBe('idle');
		expect(state.context.data).toBeNull();
		expect(state.context.error).toBeNull();
		expect(state.context.loadProgress).toBe(0);
		expect(state.context.components).toEqual({
			grid: false,
			redProp: false,
			blueProp: false,
			redArrow: false,
			blueArrow: false
		});
		expect(state.context.stateHistory).toEqual([]);
	});

	it('should transition to initializing when setting data', () => {
		// Send SET_DATA event
		pictographMachineContainer.send({
			type: 'SET_DATA',
			data: defaultPictographData
		});

		const state = pictographMachineContainer.getSnapshot();

		// Should automatically transition to grid_loading
		expect(state.value).toBe('grid_loading');
		expect(state.context.status).toBe('grid_loading');
		expect(state.context.data).toEqual(defaultPictographData);
		expect(state.context.stateHistory.length).toBe(1);
		expect(state.context.stateHistory[0].from).toBe('idle');
		expect(state.context.stateHistory[0].to).toBe('initializing');
	});

	it('should transition to props_loading when updating grid data', () => {
		// Set initial data
		pictographMachineContainer.send({
			type: 'SET_DATA',
			data: defaultPictographData
		});

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

		// Send UPDATE_GRID_DATA event
		pictographMachineContainer.send({
			type: 'UPDATE_GRID_DATA',
			gridData: mockGridData
		});

		const state = pictographMachineContainer.getSnapshot();

		expect(state.value).toBe('props_loading');
		expect(state.context.status).toBe('props_loading');
		expect(state.context.data?.gridData).toEqual(mockGridData);
		expect(state.context.components.grid).toBe(true);
		expect(state.context.stateHistory.length).toBe(2);
		expect(state.context.stateHistory[1].from).toBe('grid_loading');
		expect(state.context.stateHistory[1].to).toBe('props_loading');
	});

	it('should transition to arrows_loading when updating prop data', () => {
		// Set initial data and grid data
		pictographMachineContainer.send({
			type: 'SET_DATA',
			data: defaultPictographData
		});

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

		pictographMachineContainer.send({
			type: 'UPDATE_GRID_DATA',
			gridData: mockGridData
		});

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

		// Send UPDATE_PROP_DATA event
		pictographMachineContainer.send({
			type: 'UPDATE_PROP_DATA',
			color: 'red',
			propData: mockPropData
		});

		const state = pictographMachineContainer.getSnapshot();

		expect(state.value).toBe('arrows_loading');
		expect(state.context.status).toBe('arrows_loading');
		expect(state.context.data?.redPropData).toEqual(mockPropData);
		expect(state.context.components.redProp).toBe(true);
		expect(state.context.stateHistory.length).toBe(3);
		expect(state.context.stateHistory[2].from).toBe('props_loading');
		expect(state.context.stateHistory[2].to).toBe('arrows_loading');
	});

	it('should update arrow data', () => {
		// Set initial data, grid data, and prop data
		pictographMachineContainer.send({
			type: 'SET_DATA',
			data: defaultPictographData
		});

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

		pictographMachineContainer.send({
			type: 'UPDATE_GRID_DATA',
			gridData: mockGridData
		});

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

		pictographMachineContainer.send({
			type: 'UPDATE_PROP_DATA',
			color: 'red',
			propData: mockPropData
		});

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

		// Send UPDATE_ARROW_DATA event
		pictographMachineContainer.send({
			type: 'UPDATE_ARROW_DATA',
			color: 'red',
			arrowData: mockArrowData
		});

		const state = pictographMachineContainer.getSnapshot();

		expect(state.context.data?.redArrowData).toEqual(mockArrowData);
		expect(state.context.components.redArrow).toBe(true);
	});

	it('should transition to complete when all components are loaded', () => {
		// Set initial data
		pictographMachineContainer.send({
			type: 'SET_DATA',
			data: defaultPictographData
		});

		// Mark all components as loaded
		pictographMachineContainer.send({
			type: 'UPDATE_COMPONENT_LOADED',
			component: 'grid'
		});

		pictographMachineContainer.send({
			type: 'UPDATE_COMPONENT_LOADED',
			component: 'redProp'
		});

		pictographMachineContainer.send({
			type: 'UPDATE_COMPONENT_LOADED',
			component: 'blueProp'
		});

		pictographMachineContainer.send({
			type: 'UPDATE_COMPONENT_LOADED',
			component: 'redArrow'
		});

		pictographMachineContainer.send({
			type: 'UPDATE_COMPONENT_LOADED',
			component: 'blueArrow'
		});

		const state = pictographMachineContainer.getSnapshot();

		expect(state.value).toBe('complete');
		expect(state.context.status).toBe('complete');
		expect(state.context.loadProgress).toBe(100);
		expect(state.context.components).toEqual({
			grid: true,
			redProp: true,
			blueProp: true,
			redArrow: true,
			blueArrow: true
		});
	});

	it('should transition to error state', () => {
		// Send SET_ERROR event
		pictographMachineContainer.send({
			type: 'SET_ERROR',
			message: 'Test error',
			component: 'test-component'
		});

		const state = pictographMachineContainer.getSnapshot();

		expect(state.value).toBe('error');
		expect(state.context.status).toBe('error');
		expect(state.context.error?.message).toBe('Test error');
		expect(state.context.error?.component).toBe('test-component');
		expect(state.context.loadProgress).toBe(0);
	});

	it('should reset to initial state', () => {
		// Set data and components
		pictographMachineContainer.send({
			type: 'SET_DATA',
			data: defaultPictographData
		});

		pictographMachineContainer.send({
			type: 'UPDATE_COMPONENT_LOADED',
			component: 'grid'
		});

		// Send RESET event
		pictographMachineContainer.send({ type: 'RESET' });

		const state = pictographMachineContainer.getSnapshot();

		expect(state.value).toBe('idle');
		expect(state.context.status).toBe('idle');
		expect(state.context.data).toBeNull();
		expect(state.context.error).toBeNull();
		expect(state.context.loadProgress).toBe(0);
		expect(state.context.components).toEqual({
			grid: false,
			redProp: false,
			blueProp: false,
			redArrow: false,
			blueArrow: false
		});
		expect(state.context.stateHistory).toEqual([]);
	});
});
