<!-- src/lib/components/Pictograph/components/PictographLoadingManager.svelte -->
<!-- FIXED: Eliminated reactive loops and cascading timeouts -->
<script lang="ts">
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PictographService } from '../PictographService';
	import type { PictographData } from '$lib/types/PictographData';
	import { untrack } from 'svelte';
	import { svgPreloadingService } from '$lib/services/SvgPreloadingService';

	const props = $props<{
		service: PictographService | null;
		pictographData?: PictographData;
		disableAnimations?: boolean;
		onLoaded?: (result: { error: boolean }) => void;
		onCreateAndPositionComponents: () => void;
		onShowPictograph: (show: boolean) => void;
		onStateChange: (state: string) => void;
	}>();

	// CRITICAL FIX: Simplified state management - no complex reactive tracking
	let loadedComponents = $state(new Set<string>());
	let requiredComponents = $state(['grid']);
	let isProcessingCallback = $state(false); // Single flag to prevent cascading calls
	let isProcessingGridLoaded = $state(false); // Specific flag for grid loading

	// CRITICAL FIX: Single callback handler that prevents loops
	function handleGridLoaded(_data: GridData) {
		// CRITICAL FIX: Prevent multiple grid loading cycles
		if (isProcessingGridLoaded || isProcessingCallback) {
			return;
		}

		// CRITICAL FIX: Set busy flags
		isProcessingGridLoaded = true;
		
		try {
			untrack(() => {
				loadedComponents.add('grid');
			});

			// CRITICAL FIX: Check preloading once, then execute immediately or with minimal delay
			const isPreloaded = svgPreloadingService.isReady();
			const delay = props.disableAnimations || isPreloaded ? 0 : 100;

			if (delay === 0) {
				executeGridCallback();
			} else {
				setTimeout(() => executeGridCallback(), delay);
			}
		} catch (error) {
			console.error('Error handling grid loaded:', error);
			// CRITICAL FIX: Always clear the busy flag on error
			isProcessingGridLoaded = false;
		}
	}

	function executeGridCallback() {
		try {
			if (props.pictographData) {
				props.onCreateAndPositionComponents();
			}
		} catch (error) {
			console.error('Error in grid callback:', error);
		} finally {
			// CRITICAL FIX: Always clear the busy flags
			isProcessingGridLoaded = false;
			isProcessingCallback = false;
		}
	}

	// CRITICAL FIX: Simplified component loading without cascading timeouts
	function handleComponentLoaded(component: string) {
		if (isProcessingCallback || loadedComponents.has(component)) return;

		// CRITICAL FIX: Set busy flag
		isProcessingCallback = true;

		try {
			untrack(() => {
				loadedComponents.add(component);
			});

			checkAllComponentsLoaded();
		} catch (error) {
			console.error('Error handling component loaded:', error);
			// CRITICAL FIX: Clear busy flag on error
			isProcessingCallback = false;
		}
	}

	function handleGlyphLoaded(_event: CustomEvent<boolean>) {
		if (isProcessingCallback) return;
		
		// CRITICAL FIX: Set busy flag
		isProcessingCallback = true;

		try {
			untrack(() => {
				loadedComponents.add('glyph');
			});

			checkAllComponentsLoaded();
		} catch (error) {
			console.error('Error handling glyph loaded:', error);
			// CRITICAL FIX: Clear busy flag on error
			isProcessingCallback = false;
		}
	}

	// CRITICAL FIX: Single function to check completion and notify
	function checkAllComponentsLoaded() {
		if (isProcessingCallback) return;

		const allLoaded = requiredComponents.every(comp => loadedComponents.has(comp));
		
		if (allLoaded) {
			try {
				// CRITICAL FIX: Check preloading once and execute accordingly
				const isPreloaded = svgPreloadingService.isReady();
				const delay = props.disableAnimations || isPreloaded ? 0 : 100;

				if (delay === 0) {
					executeCompletionCallback();
				} else {
					setTimeout(() => executeCompletionCallback(), delay);
				}
			} catch (error) {
				console.error('Error checking component completion:', error);
				// CRITICAL FIX: Clear busy flag on error
				isProcessingCallback = false;
			}
		} else {
			// CRITICAL FIX: Clear busy flag if not all loaded yet
			isProcessingCallback = false;
		}
	}

	function executeCompletionCallback() {
		try {
			props.onShowPictograph(true);
			props.onStateChange('complete');
			
			// CRITICAL FIX: Single callback execution with microtask
			queueMicrotask(() => {
				try {
					props.onLoaded?.({ error: false });
				} catch (error) {
					console.error('Error in completion callback:', error);
				}
			});
		} catch (error) {
			console.error('Error in completion execution:', error);
		} finally {
			isProcessingCallback = false;
		}
	}

	// Management functions - simplified
	function updateRequiredComponents(components: string[]) {
		requiredComponents = components;
	}

	function updateTotalComponentsToLoad(total: number) {
		// CRITICAL FIX: Removed totalComponentsToLoad state to reduce reactivity
		// Progress can be calculated from requiredComponents.length if needed
	}

	function resetLoadingState() {
		untrack(() => {
			loadedComponents = new Set<string>();
			requiredComponents = ['grid'];
			// CRITICAL FIX: Reset all busy flags
			isProcessingCallback = false;
			isProcessingGridLoaded = false;
		});
	}

	// Export functions
	export {
		handleGridLoaded,
		handleComponentLoaded,
		handleGlyphLoaded,
		updateRequiredComponents,
		updateTotalComponentsToLoad,
		resetLoadingState
	};

	// CRITICAL FIX: Simplified progress calculation
	export function getLoadProgress() {
		return Math.floor((loadedComponents.size / requiredComponents.length) * 100);
	}

	export function getComponentsLoaded() {
		return loadedComponents.size;
	}

	export function getTotalComponentsToLoad() {
		return requiredComponents.length;
	}
</script>