// src/lib/components/Pictograph/composables/usePictographLoading.ts
import { get } from 'svelte/store';
import type { PictographState } from './usePictographState';
import {
	handleGridLoaded as handleGridLoadedUtil,
	handleComponentLoaded as handleComponentLoadedUtil,
	checkLoadingComplete as checkLoadingCompleteUtil,
	type LoadingManagerContext
} from '../managers/PictographLoadingManager';
import type { GridData } from '$lib/components/objects/Grid/GridData';

export function usePictographLoading(
	state: PictographState,
	dispatch: (event: string, detail?: any) => void,
	createAndPositionComponents: () => void,
	checkLoadingComplete: () => void,
	disableAnimations = false
) {
	// Create loading manager context
	function getLoadingManagerContext(): LoadingManagerContext {
		return {
			state: {
				set: (value: string) => state.state.set(value),
				value: get(state.state)
			},
			loadedComponents: get(state.loadedComponents),
			requiredComponents: get(state.requiredComponents),
			componentsLoaded: get(state.componentsLoaded),
			totalComponentsToLoad: get(state.totalComponentsToLoad),
			dispatch,
			pictographData: get(state.pictographDataStore)
		};
	}

	function handleGridLoaded(data: GridData) {
		try {
			state.gridData.set(data);
			handleGridLoadedUtil(data, getLoadingManagerContext(), {
				createAndPositionComponents
			});
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			state.errorMessage.set(errorMsg);
			state.state.set('error');
		}
	}

	// Debounced component loading for better performance
	let pendingComponents = new Set<string>();
	let debounceTimer: number | null = null;

	function handleComponentLoaded(component: string) {
		if (disableAnimations) {
			// Fast path for OptionPicker
			const context = getLoadingManagerContext();
			handleComponentLoadedUtil(component, context);
			state.componentsLoaded.set(context.componentsLoaded);

			if (!get(state.showPictograph)) {
				state.showPictograph.set(true);
				dispatch('loaded', { error: false });
			}
			return;
		}

		// Normal debounced loading
		pendingComponents.add(component);

		if (debounceTimer !== null && typeof window !== 'undefined') {
			window.clearTimeout(debounceTimer);
		}

		if (typeof window !== 'undefined') {
			debounceTimer = window.setTimeout(() => {
				if (pendingComponents.size > 0) {
					const context = getLoadingManagerContext();

					pendingComponents.forEach((comp) => {
						handleComponentLoadedUtil(comp, context);
					});

					state.componentsLoaded.set(context.componentsLoaded);
					checkLoadingComplete();
					pendingComponents.clear();
				}
				debounceTimer = null;
			}, 16);
		}
	}

	function handleGlyphLoaded(event: CustomEvent<boolean>) {
		state.glyphLoaded.set(event.detail);

		if (disableAnimations) {
			if (!get(state.showPictograph)) {
				state.showPictograph.set(true);
				dispatch('loaded', { error: false });
			}
			return;
		}

		updateShowPictographState();
	}

	function updateShowPictographState() {
		if (typeof window !== 'undefined') {
			requestAnimationFrame(() => {
				const allLoaded = get(state.allComponentsLoaded);
				const glyphLoaded = get(state.glyphLoaded);
				const shouldShow = allLoaded && glyphLoaded;

				state.showPictograph.set(shouldShow);

				if (shouldShow) {
					dispatch('loaded', { error: false });
				}
			});
		}
	}

	return {
		handleGridLoaded,
		handleComponentLoaded,
		handleGlyphLoaded,
		updateShowPictographState
	};
}
