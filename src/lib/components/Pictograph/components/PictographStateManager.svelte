<!-- src/lib/components/Pictograph/components/PictographStateManager.svelte -->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { PictographService } from '../PictographService';
	import { defaultPictographData } from '../utils/defaultPictographData';
	import { svgPreloadingService } from '$lib/services/SvgPreloadingService.svelte';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		pictographData?: PictographData;
		disableAnimations?: boolean;
		onDataInitialized?: (service: PictographService) => void;
		onStateChange?: (state: string) => void;
		onError?: (error: { message: string; component: string }) => void;
	}>();

	// State variables
	let pictographData = $state<PictographData | undefined>(props.pictographData);
	let currentState = $state('initializing');
	let errorMessage = $state<string | null>(null);
	let service = $state<PictographService | null>(null);
	let isInitialized = $state(false);

	// Use these for tracking updates
	let updateTimer: ReturnType<typeof setTimeout> | undefined;
	let lastDataHash: string = '';

	// Create a stable hash of the data for comparison
	function createDataHash(data: PictographData | undefined): string {
		if (!data) return 'undefined';

		// Create a simple hash based on key properties
		return `${data.letter || ''}-${data.gridMode || ''}-${data.startPos || ''}-${data.endPos || ''}-${data.direction || ''}-${data.redMotionData?.id || ''}-${data.blueMotionData?.id || ''}`;
	}

	// Use onMount instead of $effect to prevent infinite loops
	onMount(() => {
		// Mark as initialized
		isInitialized = true;

		// Create a hash of the initial data
		lastDataHash = createDataHash(props.pictographData);

		// Set the initial pictograph data
		pictographData = props.pictographData;

		// Initialize the pictograph if data is available
		if (pictographData) {
			initialize();
		}
	});

	// Watch for prop changes with enhanced protection against reactivity loops
	let isProcessingUpdate = false;
	$effect(() => {
		// Skip if not initialized or already processing
		if (!isInitialized || isProcessingUpdate) return;

		// Use untrack to read the current props without creating dependencies
		untrack(() => {
			// Skip updates entirely for OptionPicker (disableAnimations=true) after initial load
			// This is a critical optimization for the OptionPicker which displays many pictographs
			if (props.disableAnimations && currentState === 'complete') {
				return;
			}

			// Set processing flag to prevent re-entry
			isProcessingUpdate = true;

			const currentHash = createDataHash(props.pictographData);

			// Skip if data hasn't actually changed
			if (currentHash === lastDataHash) {
				isProcessingUpdate = false; // Reset flag before returning
				return;
			}

			// Clear any existing timer
			if (updateTimer) {
				clearTimeout(updateTimer);
			}

			// Check if SVGs are preloaded for instant processing
			const svgsPreloaded = svgPreloadingService.isReady();

			// For OptionPicker (disableAnimations=true) or when SVGs are preloaded, process immediately
			if (props.disableAnimations || svgsPreloaded) {
				// Use minimal timeout to break reactivity chains
				const delay = svgsPreloaded ? 0 : 10;
				setTimeout(() => {
					untrack(() => {
						lastDataHash = currentHash;
						pictographData = props.pictographData;

						if (pictographData) {
							updatePictographData(pictographData);
						}

						// Reset processing flag
						isProcessingUpdate = false;
					});
				}, delay);
			} else {
				// Debounce updates for normal mode with a longer timeout
				updateTimer = setTimeout(() => {
					untrack(() => {
						lastDataHash = currentHash;
						pictographData = props.pictographData;

						if (pictographData) {
							updatePictographData(pictographData);
						}

						// Reset processing flag
						isProcessingUpdate = false;
					});
				}, 150);
			}
		});

		// Cleanup function
		return () => {
			if (updateTimer) clearTimeout(updateTimer);
			isProcessingUpdate = false; // Reset flag on cleanup
		};
	});

	// Initialize the pictograph with protection against reactivity loops
	function initialize() {
		try {
			// Use untrack to prevent reactivity loops
			untrack(() => {
				// Create service
				service = new PictographService(pictographData || defaultPictographData);

				// Set initial state based on data
				if (pictographData) {
					if (hasRequiredMotionData(pictographData)) {
						currentState = 'loading';
					} else {
						currentState = 'grid_only';
					}
				} else {
					currentState = 'grid_only';
				}

				// Notify parent component
				if (props.onDataInitialized && service) {
					props.onDataInitialized(service);
				}

				// Notify state change
				if (props.onStateChange) {
					props.onStateChange(currentState);
				}
			});
		} catch (error) {
			handleError('initialization', error);
		}
	}

	// Update pictograph data with protection against reactivity loops
	function updatePictographData(newData: PictographData) {
		try {
			// Use untrack to prevent reactivity loops
			untrack(() => {
				// Update service data
				if (service) {
					service.updateData(newData);
				}

				// Notify parent component
				if (props.onDataInitialized && service) {
					props.onDataInitialized(service);
				}
			});
		} catch (error) {
			handleError('data_update', error);
		}
	}

	// Error handling with protection against reactivity loops
	function handleError(source: string, error: any) {
		// Use untrack to prevent reactivity loops
		untrack(() => {
			const message = error instanceof Error ? error.message : String(error);

			// Update state
			errorMessage = message;
			currentState = 'error';

			// Notify state change
			if (props.onStateChange) {
				props.onStateChange(currentState);
			}

			// Use setTimeout to break the reactivity chain for callbacks
			setTimeout(() => {
				// Notify parent component
				if (props.onError) {
					props.onError({ message, component: source });
				}
			}, 50);
		});
	}

	// Check if pictograph data has required motion data
	function hasRequiredMotionData(data: PictographData): boolean {
		return Boolean(data.redMotionData || data.blueMotionData);
	}

	// REMOVED: This $effect was causing infinite loops by duplicating state change notifications
	// The state changes are already handled in the initialize() and handleError() functions
	// This redundant effect was triggering on every state change and causing cascading updates
</script>

<!-- This component doesn't render anything, it just manages state -->
