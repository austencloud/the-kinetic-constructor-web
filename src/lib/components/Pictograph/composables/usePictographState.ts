// src/lib/components/Pictograph/composables/usePictographState.ts
import { writable, derived, type Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '../../objects/Prop/PropData';
import type { ArrowData } from '../../objects/Arrow/ArrowData';
import type { GridData } from '../../objects/Grid/GridData';
import type { PictographService } from '../PictographService';
import { defaultPictographData } from '../utils/defaultPictographData';
import type { PictographDataSnapshot } from '../utils/dataComparison';

export interface PictographState {
	// Data stores
	pictographDataStore: Writable<PictographData>;

	// Component state
	state: Writable<string>;
	errorMessage: Writable<string | null>;

	// Component data
	gridData: Writable<GridData | null>;
	redPropData: Writable<PropData | null>;
	bluePropData: Writable<PropData | null>;
	redArrowData: Writable<ArrowData | null>;
	blueArrowData: Writable<ArrowData | null>;

	// Loading state
	loadedComponents: Writable<Set<string>>;
	requiredComponents: Writable<string[]>;
	totalComponentsToLoad: Writable<number>;
	componentsLoaded: Writable<number>;
	renderCount: Writable<number>;
	loadProgress: Writable<number>;

	// Enhanced loading state
	glyphLoaded: Writable<boolean>;
	allComponentsLoaded: Writable<boolean>;
	showPictograph: Writable<boolean>;

	// Service and snapshots
	service: Writable<PictographService | null>;
	lastDataSnapshot: Writable<PictographDataSnapshot | null>;
}

export function createPictographState(
	initialData?: PictographData,
	disableAnimations = false
): PictographState {
	const state = {
		// Data stores
		pictographDataStore: writable(initialData || defaultPictographData),

		// Component state
		state: writable('initializing'),
		errorMessage: writable<string | null>(null),

		// Component data
		gridData: writable<GridData | null>(null),
		redPropData: writable<PropData | null>(null),
		bluePropData: writable<PropData | null>(null),
		redArrowData: writable<ArrowData | null>(null),
		blueArrowData: writable<ArrowData | null>(null),

		// Loading state
		loadedComponents: writable(new Set<string>()),
		requiredComponents: writable(['grid']),
		totalComponentsToLoad: writable(1),
		componentsLoaded: writable(0),
		renderCount: writable(0),
		loadProgress: writable(0),

		// Enhanced loading state - skip animations for OptionPicker
		glyphLoaded: writable(disableAnimations),
		allComponentsLoaded: writable(disableAnimations),
		showPictograph: writable(disableAnimations),

		// Service and snapshots
		service: writable<PictographService | null>(null),
		lastDataSnapshot: writable<PictographDataSnapshot | null>(null)
	};

	// Derived store for load progress calculation
	const progressStore = derived(
		[state.componentsLoaded, state.totalComponentsToLoad],
		([loaded, total]) => Math.floor((loaded / total) * 100)
	);

	progressStore.subscribe((progress) => {
		state.loadProgress.set(progress);
	});

	return state;
}
