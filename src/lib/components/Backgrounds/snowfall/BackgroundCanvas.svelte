<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { createBackgroundManager } from '../core/BackgroundManager';
	import { BackgroundFactory } from '../core/BackgroundFactory';
	import type { BackgroundType, PerformanceMetrics, QualityLevel } from '../types/types';

	// Event dispatcher to notify when background is ready
	const dispatch = createEventDispatcher<{
		ready: void;
		performanceReport: PerformanceMetrics;
	}>();

	// Props
	export let backgroundType: BackgroundType = 'snowfall';
	export let appIsLoading = true;

	// Create background manager
	const manager = createBackgroundManager();

	// Canvas reference
	let canvas: HTMLCanvasElement;

	// Watch for app loading state changes
	$: if (appIsLoading !== undefined) {
		// Update quality based on loading state
		const quality: QualityLevel = appIsLoading ? 'medium' : 'high';
		manager.setQuality(quality);
		manager.setLoading(appIsLoading);
	}

	// Create background system based on type
	let backgroundSystem = BackgroundFactory.createBackgroundSystem(backgroundType);

	// Watch for background type changes
	$: if (backgroundType) {
		// Only create a new system if the type changed
		if (backgroundSystem) {
			backgroundSystem.cleanup();
		}
		backgroundSystem = BackgroundFactory.createBackgroundSystem(backgroundType);

		// Initialize if canvas is already set up
		if (canvas) {
			const dimensions = get(manager.dimensions);
			const quality = get(manager.qualityMode);
			backgroundSystem.initialize(dimensions, quality);
		}
	}

	onMount(() => {
		if (!canvas) return;

		// Initialize canvas with the manager
		manager.initializeCanvas(canvas, () => {
			// Initialize background system
			const dimensions = get(manager.dimensions);
			const quality = get(manager.qualityMode);
			backgroundSystem.initialize(dimensions, quality);

			// Dispatch ready event
			dispatch('ready');
		});

		// Start animation
		manager.startAnimation(
			(ctx, dimensions) => {
				// Update and draw the background system
				backgroundSystem.update(dimensions);
				backgroundSystem.draw(ctx, dimensions);
			},
			(metrics) => {
				// Report performance metrics
				dispatch('performanceReport', metrics);
			}
		);
	});

	onDestroy(() => {
		// Clean up resources
		if (backgroundSystem) {
			backgroundSystem.cleanup();
		}
		manager.cleanup();
	});

	// Public API for parent components
	export function setQuality(quality: QualityLevel) {
		manager.setQuality(quality);
		if (backgroundSystem) {
			backgroundSystem.setQuality(quality);
		}
	}
</script>

<canvas
	bind:this={canvas}
	style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; object-fit: contain;"
></canvas>
