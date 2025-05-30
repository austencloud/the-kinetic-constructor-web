<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { useBackgroundContext } from './contexts/BackgroundContext.svelte';
	import { BackgroundFactory } from './core/BackgroundFactory';
	import type {
		BackgroundType,
		PerformanceMetrics,
		QualityLevel,
		BackgroundSystem
	} from './types/types';
	import { browser } from '$app/environment';

	// Define props with Svelte 5 runes
	const props = $props<{
		backgroundType?: BackgroundType;
		appIsLoading?: boolean;
		onReady?: () => void;
		onPerformanceReport?: (metrics: PerformanceMetrics) => void;
	}>();

	// NUCLEAR FIX: Use props directly, no internal state synchronization
	let isInitialized = $state(false);
	let activeContext = browser ? useBackgroundContext() : null;
	let currentBackgroundSystem: BackgroundSystem | null = null;
	let hasCalledOnReady = false; // Prevent multiple onReady calls

	// TEMPORARY: Disable this effect entirely to test
	// $effect(() => {
	// 	EffectLoopDetector.logEffect('BackgroundCanvas', 'prop-sync', {
	// 		bgType: props.backgroundType,
	// 		loading: props.appIsLoading,
	// 		lastBgType: lastBackgroundType,
	// 		lastLoading: lastAppIsLoading
	// 	});

	// 	// NUCLEAR: Capture props in completely isolated scope
	// 	untrack(() => {
	// 		const propBgType = props.backgroundType;
	// 		const propLoading = props.appIsLoading;

	// 		// Only update if props actually changed from external source
	// 		if (propBgType !== undefined && propBgType !== lastBackgroundType) {
	// 			lastBackgroundType = propBgType;
	// 			// Use setTimeout to break reactive chain completely
	// 			setTimeout(() => {
	// 				backgroundType = propBgType;
	// 			}, 0);
	// 		}
	// 		if (propLoading !== undefined && propLoading !== lastAppIsLoading) {
	// 			lastAppIsLoading = propLoading;
	// 			// Use setTimeout to break reactive chain completely
	// 			setTimeout(() => {
	// 				appIsLoading = propLoading;
	// 			}, 0);
	// 		}
	// 	});
	// });

	// TEMPORARY: Completely disable this effect to test if it's the cause
	// $effect(() => {
	// 	EffectLoopDetector.logEffect('BackgroundCanvas', 'context-update', {
	// 		initialized: isInitialized,
	// 		hasContext: !!activeContext,
	// 		contextBgType: activeContext?.backgroundType,
	// 		localBgType: backgroundType
	// 	});

	// 	// NUCLEAR: Completely disable this effect during problematic initialization phase
	// 	if (!browser || !isInitialized || !activeContext || isSettingContext) return;

	// 	// NUCLEAR: Use untrack for everything and delay execution
	// 	untrack(() => {
	// 		const contextBgType = activeContext.backgroundType;
	// 		const localBgType = backgroundType;

	// 		if (contextBgType !== localBgType) {
	// 			// NUCLEAR: Delay context update to break reactive chain completely
	// 			isSettingContext = true;
	// 			setTimeout(() => {
	// 				try {
	// 					if (activeContext && activeContext.backgroundType !== localBgType) {
	// 						activeContext.setBackgroundType(localBgType);
	// 					}
	// 				} finally {
	// 					isSettingContext = false;
	// 				}
	// 			}, 10); // Longer delay to ensure all effects complete
	// 		}
	// 	});
	// });

	// Use let for the canvas element
	let canvas: HTMLCanvasElement | undefined;

	onMount(() => {
		if (!browser) {
			return;
		}

		if (!canvas) {
			return;
		}

		if (activeContext) {
			// Test context operations with untrack() protection
			untrack(() => {
				// Set initial values from props to context once on mount
				const propBgType = props.backgroundType || 'nightSky';
				const propLoading = props.appIsLoading !== undefined ? props.appIsLoading : true;

				if (propBgType && propBgType !== activeContext.backgroundType) {
					activeContext.setBackgroundType(propBgType);
				}

				if (propLoading !== undefined && propLoading !== activeContext.isLoading) {
					activeContext.setLoading(propLoading);

					const quality: QualityLevel = propLoading ? 'medium' : 'high';
					if (quality !== activeContext.qualityLevel) {
						activeContext.setQuality(quality);
					}
				}
			});

			// Get the background system if it exists
			if ('backgroundSystem' in activeContext) {
				currentBackgroundSystem = (activeContext as any).backgroundSystem;
			}

			// Test Three.js initialization with untrack() protection
			untrack(() => {
				if (canvas) {
					activeContext.initializeCanvas(canvas, () => {
						// Get updated background system after initialization
						if ('backgroundSystem' in activeContext) {
							currentBackgroundSystem = (activeContext as any).backgroundSystem;
						}

						// Call the onReady callback if provided (but only once)
						if (props.onReady && !hasCalledOnReady) {
							hasCalledOnReady = true;
							props.onReady();
						}
						isInitialized = true;
					});
				}
			});

			// Create completely non-reactive snapshot of all state needed for animation
			const reactiveFirewall = untrack(() => {
				return {
					// Capture background system reference once
					backgroundSystem:
						'backgroundSystem' in activeContext ? (activeContext as any).backgroundSystem : null,
					// Capture any other reactive values that might be needed
					isActive: true,
					qualityLevel: activeContext.qualityLevel || 'medium'
				};
			});

			activeContext.startAnimation(
				(ctx, dimensions) => {
					// Just draw a simple gradient to test if animation loop itself causes issues
					const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);
					gradient.addColorStop(0, '#0A0E2C');
					gradient.addColorStop(1, '#4A5490');
					ctx.fillStyle = gradient;
					ctx.fillRect(0, 0, dimensions.width, dimensions.height);

					// NO BACKGROUND SYSTEM CALLS AT ALL
					// if (reactiveFirewall.backgroundSystem) {
					// 	reactiveFirewall.backgroundSystem.update(dimensions);
					// 	reactiveFirewall.backgroundSystem.draw(ctx, dimensions);
					// }
				},
				(metrics) => {
					// PERFORMANCE MONITORING: Completely isolated from reactive state
					// No reactive state access - just pure performance reporting
					if (props.onPerformanceReport) {
						// Create non-reactive metrics copy
						const nonReactiveMetrics = {
							fps: metrics.fps,
							warnings: [...metrics.warnings]
						};
						props.onPerformanceReport(nonReactiveMetrics);
					}
				}
			);
		}

		isInitialized = true;
	});

	// Listen for background change events - only in browser
	function handleBackgroundChange(event: CustomEvent) {
		if (!browser || !isInitialized) return;

		// CRITICAL FIX: Use untrack() to prevent event handlers from triggering reactive updates
		untrack(() => {
			if (event.detail && typeof event.detail === 'string') {
				const newBackgroundType = event.detail as BackgroundType;
				const currentBgType = props.backgroundType || 'nightSky';

				// Only update context directly, no internal state
				if (currentBgType !== newBackgroundType) {
					// Update context directly
					if (activeContext) {
						activeContext.setBackgroundType(newBackgroundType);
					}
				}
			}
		});
	}

	onDestroy(() => {
		if (!browser) return;

		// Remove event listener
		window.removeEventListener('changeBackground', handleBackgroundChange as EventListener);

		// Use active context cleanup if available
		if (activeContext) {
			activeContext.stopAnimation();
		}

		// Clean up background system if needed
		if (currentBackgroundSystem) {
			currentBackgroundSystem.cleanup();
			currentBackgroundSystem = null;
		}
	});

	// Maintain the same public API - only in browser
	export function setQuality(quality: QualityLevel) {
		if (!browser || !isInitialized) return;

		if (activeContext) {
			activeContext.setQuality(quality);
		} else if (currentBackgroundSystem) {
			currentBackgroundSystem.setQuality(quality);
		}
	}

	// Note: BackgroundCanvas now requires BackgroundProvider context
	// Legacy fallback has been removed in favor of the reactive firewall pattern
</script>

<div class="background-canvas-container">
	<canvas
		bind:this={canvas}
		class="background-canvas"
		style="
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: 100%;
			z-index: -1;
		"
	></canvas>
</div>

<style>
	.background-canvas-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		overflow: hidden;
	}

	.background-canvas {
		display: block;
	}
</style>
