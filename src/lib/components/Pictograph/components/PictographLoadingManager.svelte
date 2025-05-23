<!-- src/lib/components/Pictograph/components/PictographLoadingManager.svelte -->
<script lang="ts">
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PictographService } from '../PictographService';
	import type { PictographData } from '$lib/types/PictographData';
	import { untrack } from 'svelte';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		service: PictographService | null;
		pictographData?: PictographData;
		disableAnimations?: boolean;
		onLoaded?: (result: { error: boolean }) => void;
		onCreateAndPositionComponents: () => void;
		onShowPictograph: (show: boolean) => void;
		onStateChange: (state: string) => void;
	}>();

	// State variables
	let componentsLoaded = $state(0);
	let totalComponentsToLoad = $state(1);
	let loadedComponents = $state(new Set<string>());
	let requiredComponents = $state(['grid']);
	let isProcessingGrid = $state(false);

	// Handle grid loaded event with enhanced protection against infinite loops
	function handleGridLoaded(data: GridData) {
		try {
			// Skip if we're already processing
			if (isProcessingGrid) {
				return;
			}

			// Mark that we're processing to prevent reactivity loops
			isProcessingGrid = true;

			// Make a local copy of the data to avoid reactivity issues
			const localData = { ...data };

			// Update loaded components tracking
			if (!loadedComponents.has('grid')) {
				loadedComponents.add('grid');
				componentsLoaded++;
			}

			// Use a longer timeout to completely break the reactivity chain
			setTimeout(() => {
				try {
					// Get current state from parent
					const localState = props.onStateChange ? 'loading' : 'complete';
					const localPictographData = props.pictographData;

					if (localState === 'loading' && localPictographData) {
						// Create components with a delay to break reactivity chain
						setTimeout(() => {
							props.onCreateAndPositionComponents();
						}, 50);
					}
				} catch (callbackError) {
					// Error handling without console log
				} finally {
					// Always reset processing flag
					isProcessingGrid = false;
				}
			}, 100);
		} catch (error) {
			// Reset processing flag on error
			isProcessingGrid = false;
			throw error;
		}
	}

	// Handle component loaded event with protection against reactivity loops
	function handleComponentLoaded(component: string) {
		// Use untrack to prevent reactivity loops
		untrack(() => {
			// Add the component to the loaded components set
			if (!loadedComponents.has(component)) {
				// Immediately add to loaded components to prevent duplicate processing
				loadedComponents.add(component);

				// Use a timeout to break the reactivity chain for the rest of the processing
				setTimeout(() => {
					untrack(() => {
						// Update the counter
						componentsLoaded++;

						// Check if all required components are loaded
						const allLoaded = requiredComponents.every((comp) => loadedComponents.has(comp));

						// Update state if all components are loaded
						if (allLoaded) {
							props.onShowPictograph(true);
							props.onStateChange('complete');

							// Notify parent component
							if (props.onLoaded) {
								setTimeout(() => {
									props.onLoaded?.({ error: false });
								}, 200); // Use a longer timeout
							}
						}
					});
				}, 100); // Use a longer timeout
			}
		});
	}

	// Handle glyph loaded event with protection against reactivity loops
	function handleGlyphLoaded(_event: CustomEvent<boolean>) {
		// Use untrack to prevent reactivity loops
		untrack(() => {
			// Use a longer timeout to break the reactivity chain
			setTimeout(() => {
				untrack(() => {
					// Force the pictograph to show
					props.onShowPictograph(true);
					props.onStateChange('complete');

					// Notify parent component with a longer timeout
					if (props.onLoaded) {
						setTimeout(() => {
							props.onLoaded?.({ error: false });
						}, 200); // Use a longer timeout
					}
				});
			}, 100); // Use a longer timeout
		});
	}

	// Notify loaded with protection against reactivity loops
	function notifyLoaded(hasError: boolean) {
		// Use untrack to prevent reactivity loops
		untrack(() => {
			// Use a timeout to break the reactivity chain
			setTimeout(() => {
				// Notify parent component
				if (props.onLoaded) {
					props.onLoaded?.({ error: hasError });
				}
			}, 50);
		});
	}

	// Update required components
	function updateRequiredComponents(components: string[]) {
		requiredComponents = components;
	}

	// Update total components to load
	function updateTotalComponentsToLoad(total: number) {
		totalComponentsToLoad = total;
	}

	// Reset loading state
	function resetLoadingState() {
		componentsLoaded = 0;
		loadedComponents = new Set<string>();
		requiredComponents = ['grid'];
		totalComponentsToLoad = 1;
	}

	// Expose methods to parent component
	export {
		handleGridLoaded,
		handleComponentLoaded,
		handleGlyphLoaded,
		updateRequiredComponents,
		updateTotalComponentsToLoad,
		resetLoadingState
	};

	export function getLoadProgress() {
		return Math.floor((componentsLoaded / totalComponentsToLoad) * 100);
	}

	export function getComponentsLoaded() {
		return componentsLoaded;
	}

	export function getTotalComponentsToLoad() {
		return totalComponentsToLoad;
	}
</script>

<!-- This component doesn't render anything, it just manages loading state -->
