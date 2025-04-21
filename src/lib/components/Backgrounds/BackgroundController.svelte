<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { getService } from '$lib/core/di/serviceContext';
	import { SERVICE_TOKENS } from '$lib/core/di/ServiceTokens';
	import type { BackgroundService } from '$lib/core/services/BackgroundService';
	import { ErrorSeverity, type ErrorHandler } from '$lib/core/services/ErrorHandling';
	import type {
		BackgroundSystem,
		BackgroundType,
		QualityLevel,
		Dimensions
	} from '$lib/components/Backgrounds/types/types';

	// Props
	export let type: BackgroundType = 'snowfall';
	export let quality: QualityLevel = 'medium';
	export let dimensions: Dimensions = { width: 0, height: 0 };

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		ready: undefined;
		error: { message: string };
		performanceReport: { fps: number };
	}>();

	// Services (initialized in onMount)
	let backgroundService: BackgroundService;
	let errorHandler: ErrorHandler;

	// Component state
	let backgroundSystem: BackgroundSystem | null = null;
	let canvas: HTMLCanvasElement;
	let animationFrameId: number | null = null;
	let isActive = true;

	$: if (backgroundSystem && dimensions.width && dimensions.height) {
		updateDimensions(dimensions);
	}

	$: if (backgroundSystem && quality) {
		backgroundSystem.setQuality(quality);
	}

	onMount(async () => {
		try {
			// Get services from DI container
			backgroundService = getService<BackgroundService>(SERVICE_TOKENS.BACKGROUND_SERVICE);
			errorHandler = getService<ErrorHandler>(SERVICE_TOKENS.ERROR_HANDLER);

			// Load background
			await loadBackground(type);

			// Set initial dimensions if provided
			if (dimensions.width > 0 && dimensions.height > 0) {
				backgroundService.updateDimensions(dimensions);
			}

			// Start animation loop
			startAnimationLoop();

			dispatch('ready');
		} catch (error) {
			handleError('Failed to initialize background', error);
		}
	});

	onDestroy(() => {
		stopAnimationLoop();
		if (backgroundSystem) {
			backgroundSystem.cleanup();
			backgroundSystem = null;
		}
	});

	async function loadBackground(type: BackgroundType): Promise<void> {
		try {
			backgroundSystem = await backgroundService.loadBackground(type);
		} catch (error) {
			handleError(`Failed to load background: ${type}`, error);
		}
	}

	function updateDimensions(newDimensions: Dimensions): void {
		if (backgroundService) {
			backgroundService.updateDimensions(newDimensions);
		}
	}

	function startAnimationLoop(): void {
		if (!backgroundSystem || !canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			handleError('Failed to get canvas context', null);
			return;
		}

		const animate = () => {
			if (!backgroundSystem || !isActive) return;

			// Clear canvas
			ctx.clearRect(0, 0, dimensions.width, dimensions.height);

			// Update and draw
			backgroundSystem.update(dimensions);
			backgroundSystem.draw(ctx, dimensions);

			// Report performance if available
			if (backgroundSystem.getMetrics) {
				const metrics = backgroundSystem.getMetrics();
				dispatch('performanceReport', { fps: metrics.fps });
			}

			// Schedule next frame
			animationFrameId = requestAnimationFrame(animate);
		};

		// Start the loop
		animationFrameId = requestAnimationFrame(animate);
	}

	function stopAnimationLoop(): void {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	function handleError(message: string, error: any): void {
		errorHandler.log({
			source: 'BackgroundController',
			message,
			severity: ErrorSeverity.ERROR,
			context: { error }
		});

		dispatch('error', { message });
	}
</script>

<canvas
	bind:this={canvas}
	width={dimensions.width || 300}
	height={dimensions.height || 150}
	class="background-canvas"
></canvas>

<style>
	.background-canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
