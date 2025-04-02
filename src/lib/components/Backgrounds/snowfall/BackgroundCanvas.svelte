<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { createBackgroundManager } from '../core/BackgroundManager';
	import { BackgroundFactory } from '../core/BackgroundFactory';
	import type { BackgroundType, PerformanceMetrics, QualityLevel } from '../types/types';

	const dispatch = createEventDispatcher<{
		ready: void;
		performanceReport: PerformanceMetrics;
	}>();

	export let backgroundType: BackgroundType = 'snowfall';
	export let appIsLoading = true;

	const manager = createBackgroundManager();
	let canvas: HTMLCanvasElement;

	$: if (appIsLoading !== undefined) {
		const quality: QualityLevel = appIsLoading ? 'medium' : 'high';
		manager.setQuality(quality);
		manager.setLoading(appIsLoading);
	}

	let backgroundSystem = BackgroundFactory.createBackgroundSystem(backgroundType);

	$: if (backgroundType) {
		if (backgroundSystem) {
			backgroundSystem.cleanup();
		}
		backgroundSystem = BackgroundFactory.createBackgroundSystem(backgroundType);

		if (canvas) {
			const dimensions = get(manager.dimensions);
			const quality = get(manager.qualityMode);
			backgroundSystem.initialize(dimensions, quality);
		}
	}

	onMount(() => {
		if (!canvas) return;

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
	});

	onDestroy(() => {
		if (backgroundSystem) {
			backgroundSystem.cleanup();
		}
		manager.cleanup();
	});

	export function setQuality(quality: QualityLevel) {
		manager.setQuality(quality);
		if (backgroundSystem) {
			backgroundSystem.setQuality(quality);
		}
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
