<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { setBackgroundContext } from './contexts/BackgroundContext';
	import type { BackgroundType, QualityLevel } from './types/types';

	// Define props with defaults
	export let backgroundType: BackgroundType = 'snowfall';
	export let initialQuality: QualityLevel | undefined = undefined;
	export let isLoading: boolean = false;

	// Set up the context
	const backgroundContext = setBackgroundContext();

	// Initialize background type and handle changes
	$: if (backgroundType) {
		console.log('BackgroundProvider: Setting background type to', backgroundType);
		backgroundContext.setBackgroundType(backgroundType);
	}

	// Listen for background change events
	function handleBackgroundChange(event: CustomEvent) {
		if (event.detail && typeof event.detail === 'string') {
			console.log('BackgroundProvider received background change event:', event.detail);
			const newBackgroundType = event.detail as BackgroundType;

			// Only update if the background type has changed
			if (backgroundType !== newBackgroundType) {
				console.log('BackgroundProvider: Updating background type from event:', newBackgroundType);
				backgroundType = newBackgroundType;
				backgroundContext.setBackgroundType(newBackgroundType);
			}
		}
	}

	// Initialize quality if provided
	onMount(() => {
		if (initialQuality) {
			backgroundContext.setQuality(initialQuality);
		}

		backgroundContext.setLoading(isLoading);

		// Add event listener for background changes
		if (typeof window !== 'undefined') {
			window.addEventListener('changeBackground', handleBackgroundChange as EventListener);
		}
	});

	// Update loading state when it changes
	$: backgroundContext.setLoading(isLoading);

	// Clean up on destroy
	onDestroy(() => {
		// Remove event listener
		if (typeof window !== 'undefined') {
			window.removeEventListener('changeBackground', handleBackgroundChange as EventListener);
		}

		backgroundContext.cleanup();
	});
</script>

<slot />
