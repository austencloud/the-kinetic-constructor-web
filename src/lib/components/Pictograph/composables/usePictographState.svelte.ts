// src/lib/components/Pictograph/composables/usePictographState.ts
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '../../objects/Prop/PropData';
import type { ArrowData } from '../../objects/Arrow/ArrowData';
import type { GridData } from '../../objects/Grid/GridData';
import type { PictographService } from '../PictographService';
import { defaultPictographData } from '../utils/defaultPictographData';
import type { PictographDataSnapshot } from '../utils/dataComparison';

export interface PictographState {
	// Data state
	pictographData: PictographData;

	// Component state
	state: string;
	errorMessage: string | null;

	// Component data
	gridData: GridData | null;
	redPropData: PropData | null;
	bluePropData: PropData | null;
	redArrowData: ArrowData | null;
	blueArrowData: ArrowData | null;

	// Loading state
	loadedComponents: Set<string>;
	requiredComponents: string[];
	totalComponentsToLoad: number;
	componentsLoaded: number;
	renderCount: number;
	loadProgress: number;

	// Enhanced loading state
	glyphLoaded: boolean;
	allComponentsLoaded: boolean;
	showPictograph: boolean;

	// Service and snapshots
	service: PictographService | null;
	lastDataSnapshot: PictographDataSnapshot | null;

	// Actions
	setPictographData: (data: PictographData) => void;
	setState: (newState: string) => void;
	setErrorMessage: (message: string | null) => void;
	setGridData: (data: GridData | null) => void;
	setRedPropData: (data: PropData | null) => void;
	setBluePropData: (data: PropData | null) => void;
	setRedArrowData: (data: ArrowData | null) => void;
	setBlueArrowData: (data: ArrowData | null) => void;
	addLoadedComponent: (component: string) => void;
	setRequiredComponents: (components: string[]) => void;
	incrementComponentsLoaded: () => void;
	incrementRenderCount: () => void;
	setGlyphLoaded: (loaded: boolean) => void;
	setAllComponentsLoaded: (loaded: boolean) => void;
	setShowPictograph: (show: boolean) => void;
	setService: (service: PictographService | null) => void;
	setLastDataSnapshot: (snapshot: PictographDataSnapshot | null) => void;
}

export function createPictographState(
	initialData?: PictographData,
	disableAnimations = false
): PictographState {
	// Create reactive state using Svelte 5 runes
	let pictographData = $state(initialData || defaultPictographData);
	let componentState = $state('initializing');
	let errorMessage = $state<string | null>(null);
	let gridData = $state<GridData | null>(null);
	let redPropData = $state<PropData | null>(null);
	let bluePropData = $state<PropData | null>(null);
	let redArrowData = $state<ArrowData | null>(null);
	let blueArrowData = $state<ArrowData | null>(null);
	let loadedComponents = $state(new Set<string>());
	let requiredComponents = $state(['grid']);
	let totalComponentsToLoad = $state(1);
	let componentsLoaded = $state(0);
	let renderCount = $state(0);
	let glyphLoaded = $state(disableAnimations);
	let allComponentsLoaded = $state(disableAnimations);
	let showPictograph = $state(disableAnimations);
	let service = $state<PictographService | null>(null);
	let lastDataSnapshot = $state<PictographDataSnapshot | null>(null);

	// Derived load progress calculation
	const loadProgress = $derived(Math.floor((componentsLoaded / totalComponentsToLoad) * 100));

	return {
		// Getters for reactive state
		get pictographData() {
			return pictographData;
		},
		get state() {
			return componentState;
		},
		get errorMessage() {
			return errorMessage;
		},
		get gridData() {
			return gridData;
		},
		get redPropData() {
			return redPropData;
		},
		get bluePropData() {
			return bluePropData;
		},
		get redArrowData() {
			return redArrowData;
		},
		get blueArrowData() {
			return blueArrowData;
		},
		get loadedComponents() {
			return loadedComponents;
		},
		get requiredComponents() {
			return requiredComponents;
		},
		get totalComponentsToLoad() {
			return totalComponentsToLoad;
		},
		get componentsLoaded() {
			return componentsLoaded;
		},
		get renderCount() {
			return renderCount;
		},
		get loadProgress() {
			return loadProgress;
		},
		get glyphLoaded() {
			return glyphLoaded;
		},
		get allComponentsLoaded() {
			return allComponentsLoaded;
		},
		get showPictograph() {
			return showPictograph;
		},
		get service() {
			return service;
		},
		get lastDataSnapshot() {
			return lastDataSnapshot;
		},

		// Actions
		setPictographData: (data: PictographData) => {
			pictographData = data;
		},
		setState: (newState: string) => {
			componentState = newState;
		},
		setErrorMessage: (message: string | null) => {
			errorMessage = message;
		},
		setGridData: (data: GridData | null) => {
			gridData = data;
		},
		setRedPropData: (data: PropData | null) => {
			redPropData = data;
		},
		setBluePropData: (data: PropData | null) => {
			bluePropData = data;
		},
		setRedArrowData: (data: ArrowData | null) => {
			redArrowData = data;
		},
		setBlueArrowData: (data: ArrowData | null) => {
			blueArrowData = data;
		},
		addLoadedComponent: (component: string) => {
			loadedComponents = new Set([...loadedComponents, component]);
		},
		setRequiredComponents: (components: string[]) => {
			requiredComponents = components;
		},
		incrementComponentsLoaded: () => {
			componentsLoaded++;
		},
		incrementRenderCount: () => {
			renderCount++;
		},
		setGlyphLoaded: (loaded: boolean) => {
			glyphLoaded = loaded;
		},
		setAllComponentsLoaded: (loaded: boolean) => {
			allComponentsLoaded = loaded;
		},
		setShowPictograph: (show: boolean) => {
			showPictograph = show;
		},
		setService: (newService: PictographService | null) => {
			service = newService;
		},
		setLastDataSnapshot: (snapshot: PictographDataSnapshot | null) => {
			lastDataSnapshot = snapshot;
		}
	};
}
