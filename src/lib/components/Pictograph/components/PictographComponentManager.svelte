<!-- src/lib/components/Pictograph/components/PictographComponentManager.svelte -->
<!-- FIXED: Added protection against infinite loops -->
<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PropData } from '$lib/components/objects/Prop/PropData';
	import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
	import type { PictographService } from '../PictographService';
	import { untrack } from 'svelte';
	import { svgPreloadingService } from '$lib/services/SvgPreloadingService.svelte';

	const props = $props<{
		service: PictographService | null;
		pictographData?: PictographData;
		gridData: GridData | null;
		onUpdateComponents: (components: {
			redPropData: PropData | null;
			bluePropData: PropData | null;
			redArrowData: ArrowData | null;
			blueArrowData: ArrowData | null;
			requiredComponents: string[];
			totalComponentsToLoad: number;
		}) => void;
	}>();

	// CRITICAL FIX: Prevent infinite loops with a simple busy flag
	let isCreatingComponents = false;

	function createAndPositionComponents() {
		// CRITICAL FIX: Bail out if already creating components
		if (isCreatingComponents) {
			return;
		}

		// CRITICAL FIX: Basic validation
		if (!props.pictographData || !props.service || !props.gridData) {
			return;
		}

		// CRITICAL FIX: Set busy flag
		isCreatingComponents = true;

		try {
			// Use untrack to prevent reactivity loops
			untrack(() => {
				if (!props.pictographData || !props.service) return;

				// Create a local copy of the data to work with
				const localPictographData = props.pictographData;
				const localService = props.service;
				const localGridData = props.gridData;

				// Reset required components
				const newRequiredComponents = ['grid'];
				let newTotalComponentsToLoad = 1;

				// Create component data objects
				let newRedPropData = null;
				let newRedArrowData = null;
				let newBluePropData = null;
				let newBlueArrowData = null;

				// Create red components if needed
				if (localPictographData.redMotionData) {
					newRedPropData = localService.createPropData(localPictographData.redMotionData, 'red');
					newRedArrowData = localService.createArrowData(localPictographData.redMotionData, 'red');
					newRequiredComponents.push('redProp', 'redArrow');
					newTotalComponentsToLoad += 2;
				}

				// Create blue components if needed
				if (localPictographData.blueMotionData) {
					newBluePropData = localService.createPropData(localPictographData.blueMotionData, 'blue');
					newBlueArrowData = localService.createArrowData(
						localPictographData.blueMotionData,
						'blue'
					);
					newRequiredComponents.push('blueProp', 'blueArrow');
					newTotalComponentsToLoad += 2;
				}

				// Position components
				if (localGridData) {
					localService.positionComponents(
						newRedPropData,
						newBluePropData,
						newRedArrowData,
						newBlueArrowData,
						localGridData
					);
				}

				// CRITICAL FIX: Smart callback timing
				const svgsPreloaded = svgPreloadingService.isReady();

				if (svgsPreloaded) {
					// CRITICAL FIX: Immediate callback when ready, no timeout needed
					queueMicrotask(() => {
						try {
							props.onUpdateComponents({
								redPropData: newRedPropData,
								bluePropData: newBluePropData,
								redArrowData: newRedArrowData,
								blueArrowData: newBlueArrowData,
								requiredComponents: newRequiredComponents,
								totalComponentsToLoad: newTotalComponentsToLoad
							});
						} catch (error) {
							console.error('Error in onUpdateComponents callback:', error);
						} finally {
							// CRITICAL FIX: Always clear the busy flag
							isCreatingComponents = false;
						}
					});
				} else {
					// Traditional timeout for non-preloaded scenarios
					setTimeout(() => {
						try {
							props.onUpdateComponents({
								redPropData: newRedPropData,
								bluePropData: newBluePropData,
								redArrowData: newRedArrowData,
								blueArrowData: newBlueArrowData,
								requiredComponents: newRequiredComponents,
								totalComponentsToLoad: newTotalComponentsToLoad
							});
						} catch (error) {
							console.error('Error in onUpdateComponents callback:', error);
						} finally {
							// CRITICAL FIX: Always clear the busy flag
							isCreatingComponents = false;
						}
					}, 100);
				}
			});
		} catch (error) {
			// CRITICAL FIX: Clear flag on error too
			isCreatingComponents = false;
			console.error('Error in createAndPositionComponents:', error);
		}
	}

	// Export the function to make it available to parent component
	export { createAndPositionComponents };
</script>

<!-- This component doesn't render anything, it just manages component creation -->
