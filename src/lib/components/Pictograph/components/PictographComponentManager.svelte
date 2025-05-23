<!-- src/lib/components/Pictograph/components/PictographComponentManager.svelte -->
<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PropData } from '$lib/components/objects/Prop/PropData';
	import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
	import type { PictographService } from '../PictographService';
	import { untrack } from 'svelte';

	// Define props using Svelte 5 runes syntax
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

	// Create and position components with enhanced protection against reactivity loops
	function createAndPositionComponents() {
		try {
			if (!props.pictographData || !props.service || !props.gridData) {
				return;
			}

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

				// Use a longer timeout to completely break the reactivity chain
				setTimeout(() => {
					// Update state with all the new values at once in a non-reactive way
					props.onUpdateComponents({
						redPropData: newRedPropData,
						bluePropData: newBluePropData,
						redArrowData: newRedArrowData,
						blueArrowData: newBlueArrowData,
						requiredComponents: newRequiredComponents,
						totalComponentsToLoad: newTotalComponentsToLoad
					});
				}, 100);
			});
		} catch (error) {
			throw error;
		}
	}

	// Export the function to make it available to parent component
	export { createAndPositionComponents };
</script>

<!-- This component doesn't render anything, it just manages component creation -->
