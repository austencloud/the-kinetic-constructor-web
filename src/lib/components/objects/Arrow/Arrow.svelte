<!-- src/lib/components/objects/Arrow/Arrow.svelte -->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { ArrowData } from './ArrowData';
	import type { ArrowSvgData } from '../../SvgManager/ArrowSvgData';
	import { ArrowSvgLoader } from './services/ArrowSvgLoader';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { Motion } from '../Motion/Motion';
	import ArrowRotAngleManager from './ArrowRotAngleManager';
	import ArrowSvgMirrorManager from './ArrowSvgMirrorManager';
	import type { PictographService } from '$lib/components/Pictograph/PictographService';
	import type { PictographData } from '$lib/types/PictographData';

	// Props - we support both direct arrowData and store-based approach
	const props = $props<{
		arrowData?: ArrowData;
		beatId?: string;
		color?: 'red' | 'blue';
		motion?: Motion | null;
		pictographData?: PictographData | null;
		pictographService?: PictographService | null;
		loadTimeoutMs?: number; // Kept for backward compatibility
		animationDuration?: number; // Kept for backward compatibility

		// Event handlers
		loaded?: (event: { timeout?: boolean; error?: boolean }) => void;
		error?: (event: { message: string; component: string; color: string }) => void;
		imageLoaded?: () => void;
	}>();

	// Set defaults
	const arrowData = props.arrowData;
	const motion = props.motion ?? null;
	const pictographData = props.pictographData ?? null;
	const pictographService = props.pictographService ?? null;

	// Use the directly provided arrow data
	let effectiveArrowData = $state<ArrowData | undefined>(arrowData);

	// Component state - using a single state object to reduce reactivity issues
	let componentState = $state({
		svgData: null as ArrowSvgData | null,
		transform: '',
		isLoaded: false,
		hasErrored: false,
		hasCalledLoaded: false,
		isInitialized: false, // New flag to prevent multiple initializations
		isLoadingStarted: false // New flag to prevent multiple loading attempts
	});

	let rotAngleManager = $state<ArrowRotAngleManager | null>(null);

	// Services
	const svgManager = new SvgManager();
	const svgLoader = new ArrowSvgLoader(svgManager);

	// Create mirror manager only when we have arrow data
	let mirrorManager = $state<ArrowSvgMirrorManager | null>(null);

	// Initialize managers and state on component creation instead of using effects
	// This prevents reactivity loops by setting up everything once
	if (effectiveArrowData) {
		// Use untrack to prevent reactivity issues
		untrack(() => {
			// Initialize mirror manager
			const newMirrorManager = new ArrowSvgMirrorManager(effectiveArrowData);
			mirrorManager = newMirrorManager;

			// Update mirror state immediately
			newMirrorManager.updateMirror();

			// Initialize rotation angle manager
			if (pictographData) {
				rotAngleManager = new ArrowRotAngleManager(pictographData, pictographService || undefined);
			}
		});
	}

	// Calculate rotation angle once
	let rotationAngle = $state(getRotationAngle());

	// Calculate transform immediately
	if (effectiveArrowData?.coords) {
		// Apply transformations in the correct order
		const mirrorTransform = effectiveArrowData.svgMirrored ? 'scale(-1, 1)' : '';

		componentState.transform = `
			translate(${effectiveArrowData.coords.x}, ${effectiveArrowData.coords.y})
			rotate(${rotationAngle})
			${mirrorTransform}
		`.trim();
	}

	// Mobile detection no longer needed with preloaded SVGs

	/**
	 * Simple in-memory component-level cache for SVG data
	 */
	const svgDataCache = new Map<string, ArrowSvgData>();

	/**
	 * Get cached SVG data if available
	 */
	function getCachedSvgData(key: string): ArrowSvgData | undefined {
		return svgDataCache.get(key);
	}

	/**
	 * Cache SVG data for future use
	 */
	function cacheSvgData(key: string, data: ArrowSvgData): void {
		svgDataCache.set(key, data);
		// Limit cache size to prevent memory issues
		if (svgDataCache.size > 50) {
			const firstKey = svgDataCache.keys().next().value;
			if (firstKey) {
				svgDataCache.delete(firstKey);
			}
		}
	}

	/**
	 * Loads the arrow SVG using preloaded resources without timeouts
	 * Optimized for real-time updates with improved caching and protection against reactivity loops
	 */
	async function loadArrowSvg() {
		// Prevent multiple loading attempts - critical for preventing infinite loops
		if (componentState.isLoadingStarted) {
			return;
		}

		// Mark loading as started - do this outside of untrack to ensure it's set immediately
		componentState.isLoadingStarted = true;

		try {
			// Safety check
			if (!effectiveArrowData) {
				throw new Error('No arrow data available');
			}

			// Create a local copy of the arrow data to avoid reactivity issues
			const localArrowData = { ...effectiveArrowData };

			// Update mirror state before loading SVG
			if (mirrorManager) {
				mirrorManager.updateMirror();
			}

			// Create a consistent cache key for all contexts
			const cacheKey = `arrow-${localArrowData.motionType}-${localArrowData.startOri}-${localArrowData.turns}-${localArrowData.color}-${localArrowData.svgMirrored}`;

			// Check component-level cache first for immediate rendering
			const cachedData = getCachedSvgData(cacheKey);

			if (cachedData) {
				// Use untrack to prevent reactivity loops when updating state
				untrack(() => {
					// Update all state at once to reduce reactivity cycles
					componentState.svgData = cachedData;
					componentState.isLoaded = true;
					componentState.hasCalledLoaded = true;
				});

				// Use a much longer timeout to completely break the reactivity chain
				// This is crucial for preventing infinite loops
				if (props.loaded) {
					setTimeout(() => {
						// Use a try-catch to prevent errors from propagating
						try {
							props.loaded?.();
						} catch (error) {
							console.error('Error in Arrow loaded callback (cached):', error);
						}
					}, 200); // Use a longer timeout
				}
				return;
			}

			// For real-time responsiveness, use a Promise.race approach
			// This will use either the preloaded SVG or a fast fallback if loading takes too long
			const loadPromise = svgLoader.loadSvg(
				localArrowData.motionType,
				localArrowData.startOri,
				localArrowData.turns,
				localArrowData.color,
				localArrowData.svgMirrored
			);

			// Use the result as soon as it's available
			const result = await loadPromise;

			// Update state and notify with untrack to prevent reactivity loops
			untrack(() => {
				// Update all state at once to reduce reactivity cycles
				componentState.svgData = result.svgData;
				componentState.isLoaded = true;
				componentState.hasCalledLoaded = true;

				// Cache the result for future use
				cacheSvgData(cacheKey, componentState.svgData);
			});

			// Use setTimeout to break the reactivity chain for callbacks
			if (props.loaded) {
				setTimeout(() => {
					try {
						props.loaded?.();
					} catch (error) {
						console.error('Error in Arrow loaded callback:', error);
					}
				}, 200); // Use a longer timeout to ensure all other operations complete
			}
		} catch (error) {
			handleLoadError(error);
		}
	}

	/**
	 * Handles SVG loading errors with fallback and protection against reactivity loops
	 */
	function handleLoadError(error: unknown) {
		// Minimal logging in production
		if (import.meta.env.DEV) {
			console.error('Arrow load error:', error);
		} else {
			console.error('Arrow load error: ' + ((error as Error)?.message || 'Unknown error'));
		}

		// Use untrack to prevent reactivity loops when updating state
		untrack(() => {
			// Update all state at once to reduce reactivity cycles
			componentState.hasErrored = true;
			componentState.svgData = svgLoader.getFallbackSvgData();
			componentState.isLoaded = true;
			componentState.hasCalledLoaded = true;
		});

		// Use a longer timeout to completely break the reactivity chain for callbacks
		setTimeout(() => {
			// Use untrack to prevent reactivity loops
			untrack(() => {
				try {
					props.loaded?.({ error: true });
					props.error?.({
						message: (error as Error)?.message || 'Unknown error',
						component: 'Arrow',
						color: effectiveArrowData?.color || 'unknown'
					});
				} catch (callbackError) {
					console.error('Error in Arrow error callback:', callbackError);
				}
			});
		}, 100);
	}

	/**
	 * Calculates the arrow rotation angle using the manager
	 */
	function getRotationAngle(): number {
		if (motion && rotAngleManager && effectiveArrowData) {
			// Use the rotation angle manager directly
			return rotAngleManager.calculateRotationAngle(
				motion,
				effectiveArrowData.loc,
				effectiveArrowData.svgMirrored
			);
		}
		// Fall back to the arrow data's rotation angle
		return effectiveArrowData?.rotAngle || 0;
	}

	// Lifecycle hooks with protection against reactivity loops
	onMount(() => {
		// Prevent multiple initializations - critical for preventing infinite loops
		if (componentState.isInitialized) {
			return;
		}

		// Mark as initialized
		componentState.isInitialized = true;

		// Load SVG immediately if we have arrow data
		if (
			effectiveArrowData?.motionType &&
			!componentState.isLoaded &&
			!componentState.hasCalledLoaded
		) {
			// Load SVG asynchronously
			setTimeout(() => {
				// Use try-catch to prevent errors from propagating
				try {
					// Load SVG
					loadArrowSvg();
				} catch (error) {
					console.error('Error loading SVG:', error);
				}
			}, 50);
		} else if (!componentState.isLoaded) {
			// Update state in a single operation
			untrack(() => {
				componentState.isLoaded = true;
				componentState.hasCalledLoaded = true;
			});

			// Notify parent component
			if (props.loaded) {
				// Use a timeout to break the reactivity chain
				setTimeout(() => {
					try {
						props.loaded?.({ error: false });
					} catch (error) {
						console.error('Error in Arrow loaded callback:', error);
					}
				}, 50);
			}
		}
	});

	// DISABLED: Reactive loading effect to prevent infinite loops
	// This effect was causing infinite loops, so we've completely disabled it
	// and rely only on the onMount initialization

	// We've removed the tracking of previous values since they were contributing to the infinite loop
	// Instead, we use the componentState object with flags to prevent multiple initializations

	// DISABLED: Additional loading effects
	// We've completely disabled this effect and removed the isLoading state
	// to prevent reactivity loops. The component now uses a simpler approach
	// with timeouts and untrack() to break reactivity chains.
</script>

{#if componentState.svgData && componentState.isLoaded && effectiveArrowData}
	<g
		transform={componentState.transform}
		data-testid="arrow-{effectiveArrowData.color}"
		data-motion-type={effectiveArrowData.motionType}
		data-mirrored={effectiveArrowData.svgMirrored ? 'true' : 'false'}
		data-loc={effectiveArrowData.loc}
		data-rot-angle={rotationAngle}
	>
		<image
			href={componentState.svgData.imageSrc}
			width={componentState.svgData.viewBox.width}
			height={componentState.svgData.viewBox.height}
			x={-componentState.svgData.center.x}
			y={-componentState.svgData.center.y}
			aria-label="Arrow showing {effectiveArrowData.motionType} motion in {effectiveArrowData.color} direction"
			role="img"
			onload={() => props.imageLoaded?.()}
			onerror={() =>
				props.error?.({
					message: 'Image failed to load',
					component: 'Arrow',
					color: effectiveArrowData?.color || 'unknown'
				})}
		/>
	</g>
{/if}
