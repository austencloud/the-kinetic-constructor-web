// src/lib/components/Pictograph/composables/usePictographErrorHandling.ts
import { get } from 'svelte/store';
import type { PictographState } from './usePictographState';
import {
	handlePictographError,
	handlePictographComponentError,
	type ErrorHandlerContext,
	type ComponentErrorContext,
	type FallbackDataContext
} from '../handlers/PictographErrorHandler';

export function usePictographErrorHandling(
	state: PictographState,
	dispatch: (event: string, detail?: any) => void
) {
	// Create error handler context
	function getErrorHandlerContext(): ErrorHandlerContext {
		return {
			pictographDataStore: state.pictographDataStore,
			dispatch,
			state: {
				set: (value: string) => state.state.set(value)
			},
			errorMessage: {
				set: (value: string | null) => state.errorMessage.set(value)
			},
			componentsLoaded: get(state.componentsLoaded),
			totalComponentsToLoad: get(state.totalComponentsToLoad)
		};
	}

	// Create component error handler context
	function getComponentErrorContext(): ComponentErrorContext {
		return {
			loadedComponents: get(state.loadedComponents),
			componentsLoaded: get(state.componentsLoaded),
			totalComponentsToLoad: get(state.totalComponentsToLoad),
			dispatch,
			checkLoadingComplete: () => {
				// This will be handled by the main component
			}
		};
	}

	// Create fallback data context
	function getFallbackDataContext(): FallbackDataContext {
		return {
			redPropData: get(state.redPropData),
			bluePropData: get(state.bluePropData),
			redArrowData: get(state.redArrowData),
			blueArrowData: get(state.blueArrowData)
		};
	}

	// Handle general errors
	function handleError(source: string, error: any) {
		handlePictographError(source, error, getErrorHandlerContext());
	}

	// Handle component errors
	function handleComponentError(component: string, error: any) {
		handlePictographComponentError(
			component,
			error,
			getComponentErrorContext(),
			getFallbackDataContext()
		);
	}

	return {
		handleError,
		handleComponentError
	};
}
