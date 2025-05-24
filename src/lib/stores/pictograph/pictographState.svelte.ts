/**
 * Pictograph State Management with Svelte 5 Runes
 *
 * Modern replacement for pictographStore.ts using Svelte 5 runes
 */

import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import { LetterUtils } from '$lib/utils/LetterUtils';

export type PictographStatus =
	| 'idle'
	| 'initializing'
	| 'grid_loading'
	| 'props_loading'
	| 'arrows_loading'
	| 'complete'
	| 'error';

export interface PictographError {
	message: string;
	component?: string;
	timestamp: number;
}

export interface PictographComponents {
	grid: boolean;
	redProp: boolean;
	blueProp: boolean;
	redArrow: boolean;
	blueArrow: boolean;
}

export interface StateTransition {
	from: string;
	to: string;
	reason?: string;
	timestamp: number;
}

// Create individual state variables using Svelte 5 runes
export let pictographStatus = $state<PictographStatus>('idle');
export let pictographData = $state<PictographData | null>(null);
export let pictographError = $state<PictographError | null>(null);
export let loadProgress = $state(0);
export let components = $state<PictographComponents>({
	grid: false,
	redProp: false,
	blueProp: false,
	redArrow: false,
	blueArrow: false
});
export let stateHistory = $state<StateTransition[]>([]);

// Pictograph data store for CSV data
export const pictographDataState = $state<PictographData[]>([]);

// Helper functions
function toCamelCase(str: string): string {
	return str.replace(/([-_][a-z])/g, (group) =>
		group.toUpperCase().replace('-', '').replace('_', '')
	);
}

function calculateProgress(components: PictographComponents): number {
	const loadedCount = Object.values(components).filter(Boolean).length;
	const totalComponents = Object.keys(components).length;
	return Math.floor((loadedCount / totalComponents) * 100);
}

function transitionTo(newState: PictographStatus, reason?: string) {
	if (pictographStatus === newState) return;

	const newTransition = {
		from: pictographStatus,
		to: newState,
		reason,
		timestamp: Date.now()
	};

	stateHistory = [...stateHistory, newTransition].slice(-10);
	pictographStatus = newState;
}

const defaultMotionData: MotionData = {
	id: '',
	handRotDir: 'cw_shift',
	color: 'red',
	leadState: 'leading',
	motionType: 'static',
	startLoc: 'n',
	endLoc: 's',
	startOri: 'in',
	endOri: 'in',
	propRotDir: 'cw',
	turns: 0,
	prefloatMotionType: null,
	prefloatPropRotDir: null
};

function extractAttributes(record: Record<string, any>, prefix: string): MotionData {
	return {
		...defaultMotionData,
		color: prefix === 'blue' ? 'blue' : 'red',
		motionType: record[`${prefix}MotionType`] || defaultMotionData.motionType,
		startLoc: record[`${prefix}StartLoc`] || defaultMotionData.startLoc,
		endLoc: record[`${prefix}EndLoc`] || defaultMotionData.endLoc,
		propRotDir: record[`${prefix}PropRotDir`] || defaultMotionData.propRotDir
	};
}

function parseCsvToJson(csv: string, gridMode: string) {
	const lines = csv.split('\n').filter(Boolean);
	const headers = lines.shift()?.split(',').map(toCamelCase) || [];

	return lines.map((line) => {
		const values = line.split(',');
		const record = headers.reduce(
			(acc, header, index) => {
				acc[header.trim()] = values[index]?.trim();
				return acc;
			},
			{} as Record<string, any>
		);

		record.gridMode = gridMode;
		return record;
	});
}

function groupPictographsByLetter(pictographs: Record<string, any>[]): PictographData[] {
	const processedPictographs: PictographData[] = [];

	pictographs.forEach((record) => {
		const rawLetter = record.letter ? record.letter.trim() : '';

		if (!rawLetter) {
			skippedCount++;
			return;
		}

		try {
			const letter = LetterUtils.tryFromString(rawLetter);

			if (!letter) {
				skippedCount++;
				return;
			}

			const redMotionData = extractAttributes(record, 'red');
			const blueMotionData = extractAttributes(record, 'blue');

			processedPictographs.push({
				letter,
				startPos: record.startPos,
				endPos: record.endPos,
				timing: record.timing,
				direction: record.direction,
				redMotionData,
				blueMotionData,
				gridMode: record.gridMode,
				grid: '',
				gridData: null,
				redArrowData: null,
				blueArrowData: null,
				motions: [],
				redMotion: null,
				blueMotion: null,
				props: [],
				redPropData: null,
				bluePropData: null
			});
		} catch {
			skippedCount++;
		}
	});

	return processedPictographs;
}

// Action functions
export const pictographActions = {
	initializePictographData(csvData: {
		diamondData: string;
		boxData: string;
	}): PictographData[] | null {
		try {
			if (!csvData.diamondData && !csvData.boxData) {
				console.warn('No CSV data provided for initialization.');
				return null;
			}

			const diamondPictographs = parseCsvToJson(csvData.diamondData || '', 'diamond');
			const boxPictographs = parseCsvToJson(csvData.boxData || '', 'box');

			const combinedData = [...diamondPictographs, ...boxPictographs];
			const allPictographData = groupPictographsByLetter(combinedData);

			pictographDataState.splice(0, pictographDataState.length, ...allPictographData);
			return allPictographData;
		} catch (error) {
			console.error('Error initializing pictograph store:', error);
			pictographDataState.splice(0, pictographDataState.length);
			return null;
		}
	},

	setData(data: PictographData) {
		transitionTo('initializing', 'Starting to load pictograph');
		pictographData = data;
		pictographStatus = 'grid_loading';
	},

	updateComponentLoaded(component: keyof PictographComponents) {
		components[component] = true;
		loadProgress = calculateProgress(components);

		const allLoaded = Object.values(components).every(Boolean);
		if (allLoaded && pictographStatus !== 'complete') {
			transitionTo('complete', 'All components loaded');
		}
	},

	setError(message: string, component?: string) {
		const timestamp = Date.now();
		transitionTo('error', message);
		pictographError = { message, component, timestamp };
		loadProgress = 0;
	},

	updateGridData(gridData: GridData) {
		if (!pictographData) return;

		transitionTo('props_loading', 'Grid data loaded');
		pictographData.gridData = gridData;
		components.grid = true;
	},

	updatePropData(color: 'red' | 'blue', propData: PropData) {
		if (!pictographData) return;

		const key = color === 'red' ? 'redPropData' : 'bluePropData';
		const componentKey = color === 'red' ? 'redProp' : 'blueProp';

		transitionTo('arrows_loading', `${color} prop loaded`);
		(pictographData as any)[key] = propData;
		components[componentKey] = true;
	},

	updateArrowData(color: 'red' | 'blue', arrowData: ArrowData) {
		if (!pictographData) return;

		const key = color === 'red' ? 'redArrowData' : 'blueArrowData';
		const componentKey = color === 'red' ? 'redArrow' : 'blueArrow';

		(pictographData as any)[key] = arrowData;
		components[componentKey] = true;
	},

	reset() {
		pictographStatus = 'idle';
		pictographData = null;
		pictographError = null;
		loadProgress = 0;
		components = {
			grid: false,
			redProp: false,
			blueProp: false,
			redArrow: false,
			blueArrow: false
		};
		stateHistory = [];
	}
};

// Derived state functions
export function isLoading() {
	return (
		pictographStatus === 'initializing' ||
		pictographStatus === 'grid_loading' ||
		pictographStatus === 'props_loading' ||
		pictographStatus === 'arrows_loading'
	);
}

export function isComplete() {
	return pictographStatus === 'complete';
}

export function hasError() {
	return pictographStatus === 'error';
}

// Export for backward compatibility
export { pictographDataState as pictographDataStore };
