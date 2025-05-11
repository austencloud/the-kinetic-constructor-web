<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { getBackgroundContext } from './contexts/BackgroundContext';
	import { BackgroundFactory } from './core/BackgroundFactory';
	import type { BackgroundType, PerformanceMetrics, QualityLevel } from './types/types';

	const dispatch = createEventDispatcher<{
		ready: void;
		performanceReport: PerformanceMetrics;
	}>();

	// Props (maintaining the same API)
	export let backgroundType: BackgroundType = 'nightSky';
	export let appIsLoading = true;

	// Get the context (if it exists)
	const context = getBackgroundContext();

	// Set the background type in the context when it changes
	$: if (context && backgroundType) {
		context.setBackgroundType(backgroundType);
	}

	// Handle loading state changes
	$: if (context && appIsLoading !== undefined) {
		const quality: QualityLevel = appIsLoading ? 'medium' : 'high';
		context.setQuality(quality);
		context.setLoading(appIsLoading);
	}

	// Use the background system from the context
	$: backgroundSystem = context
		? get(context.backgroundSystem)
		: BackgroundFactory.createBackgroundSystem(backgroundType);

	let canvas: HTMLCanvasElement;

	// Listen for background change events
	function handleBackgroundChange(event: CustomEvent) {
		if (event.detail && typeof event.detail === 'string') {
			console.log('BackgroundCanvas received background change event:', event.detail);
			const newBackgroundType = event.detail as BackgroundType;

			// Only update if the background type has changed
			if (backgroundType !== newBackgroundType) {
				console.log('Updating background type from event:', newBackgroundType);
				backgroundType = newBackgroundType;

				// Update the background system if it exists
				if (backgroundSystem) {
					const dimensions = context
						? get(context.dimensions)
						: { width: window.innerWidth, height: window.innerHeight };
					const quality = context ? get(context.qualityLevel) : 'high';

					// Create a new background system with the new type
					const newSystem = BackgroundFactory.createBackgroundSystem({
						type: newBackgroundType,
						initialQuality: quality
					});

					// Initialize the new system
					newSystem.initialize(dimensions, quality);

					// Clean up the old system
					if (backgroundSystem) {
						backgroundSystem.cleanup();
					}

					// Replace the old system with the new one
					backgroundSystem = newSystem;
				}
			}
		}
	}

	onMount(() => {
		if (!canvas) return;

		// Add event listener for background changes
		// Only add event listener in browser environment
		if (typeof window !== 'undefined') {
			window.addEventListener('changeBackground', handleBackgroundChange as EventListener);
		}

		if (context) {
			// Use the context for initialization and animation
			context.initializeCanvas(canvas, () => {
				const dimensions = get(context.dimensions);
				const quality = get(context.qualityLevel);
				backgroundSystem.initialize(dimensions, quality);
				dispatch('ready');
			});

			context.startAnimation(
				(ctx, dimensions) => {
					backgroundSystem.update(dimensions);
					backgroundSystem.draw(ctx, dimensions);
				},
				(metrics) => {
					dispatch('performanceReport', metrics);
				}
			);
		} else {
			// Fallback to direct instantiation for backward compatibility
			const manager = createBackgroundManagerFallback();

			manager.initializeCanvas(canvas, () => {
				const dimensions = get(manager.dimensions);
				const quality = get(manager.qualityMode);
				backgroundSystem.initialize(dimensions, quality);
				dispatch('ready');
			});

			manager.startAnimation(
				(ctx, dimensions) => {
					backgroundSystem.update(dimensions);
					backgroundSystem.draw(ctx, dimensions);
				},
				(metrics) => {
					dispatch('performanceReport', metrics);
				}
			);
		}
	});

	onDestroy(() => {
		// Remove event listener
		if (typeof window !== 'undefined') {
			window.removeEventListener('changeBackground', handleBackgroundChange as EventListener);
		}

		if (backgroundSystem) {
			backgroundSystem.cleanup();
		}

		// Use context cleanup if available, otherwise do nothing
		// (the manager has its own cleanup in the other branch)
		if (context) {
			context.cleanup();
		}
	});

	// Maintain the same public API
	export function setQuality(quality: QualityLevel) {
		if (context) {
			context.setQuality(quality);
		}

		if (backgroundSystem) {
			backgroundSystem.setQuality(quality);
		}
	}

	// Import the old manager for backward compatibility
	// This is only used if the component is used outside of a BackgroundProvider
	import { createBackgroundManager } from './core/BackgroundManager';
	function createBackgroundManagerFallback() {
		console.warn(
			'BackgroundCanvas is being used without a BackgroundProvider. Consider updating your code to use the new context-based API.'
		);
		return createBackgroundManager();
	}
</script>

<canvas
	bind:this={canvas}
	style="
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
	"
></canvas>
