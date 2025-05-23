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
	import { safeEffect } from '$lib/state/core/svelte5-integration.svelte';

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

	// Component state
	let svgData = $state<ArrowSvgData | null>(null);
	let transform = $state('');
	let isLoaded = $state(false);
	let hasErrored = $state(false);
	let hasCalledLoaded = $state(false);
	let rotAngleManager = $state<ArrowRotAngleManager | null>(null);

	// Services
	const svgManager = new SvgManager();
	const svgLoader = new ArrowSvgLoader(svgManager);

	// Create mirror manager only when we have arrow data
	let mirrorManager = $state<ArrowSvgMirrorManager | null>(null);

	// Initialize managers and state on component creation instead of using effects
	// This prevents reactivity loops by setting up everything once
	if (effectiveArrowData) {
		// Create a local variable to avoid reactivity issues
		const localArrowData = effectiveArrowData;

		// Initialize mirror manager
		mirrorManager = new ArrowSvgMirrorManager(localArrowData);

		// Initialize rotation angle manager
		if (pictographData) {
			rotAngleManager = new ArrowRotAngleManager(pictographData, pictographService || undefined);
		}

		// Update mirror state
		const localMirrorManager = mirrorManager;
		if (localMirrorManager) {
			localMirrorManager.updateMirror();
		}
	}

	// Calculate rotation angle once
	let rotationAngle = $state(getRotationAngle());

	// Calculate transform immediately
	if (effectiveArrowData?.coords) {
		// Apply transformations in the correct order
		const mirrorTransform = effectiveArrowData.svgMirrored ? 'scale(-1, 1)' : '';

		transform = `
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
		console.log('[DEBUG] loadArrowSvg called');
		try {
			// Safety check
			if (!effectiveArrowData) {
				console.log('[DEBUG] No arrow data available');
				throw new Error('No arrow data available');
			}

			console.log('[DEBUG] Loading arrow SVG for:', {
				motionType: effectiveArrowData.motionType,
				startOri: effectiveArrowData.startOri,
				turns: effectiveArrowData.turns,
				color: effectiveArrowData.color,
				svgMirrored: effectiveArrowData.svgMirrored
			});

			// Update mirror state before loading SVG
			if (mirrorManager) {
				console.log('[DEBUG] Updating mirror state');
				mirrorManager.updateMirror();
			}

			// Create a consistent cache key for all contexts
			const cacheKey = `arrow-${effectiveArrowData.motionType}-${effectiveArrowData.startOri}-${effectiveArrowData.turns}-${effectiveArrowData.color}-${effectiveArrowData.svgMirrored}`;
			console.log('[DEBUG] Arrow cache key:', cacheKey);

			// Check component-level cache first for immediate rendering
			const cachedData = getCachedSvgData(cacheKey);

			if (cachedData) {
				console.log('[DEBUG] Using cached arrow SVG data');
				// Use untrack to prevent reactivity loops when updating state
				untrack(() => {
					// Use cached data for immediate response
					svgData = cachedData;
					isLoaded = true;
				});

				// Use a much longer timeout to completely break the reactivity chain
				// This is crucial for preventing infinite loops
				if (props.loaded && !hasCalledLoaded) {
					console.log('[DEBUG] Scheduling loaded callback (cached)');
					// Set a flag to prevent multiple callbacks
					hasCalledLoaded = true;
					setTimeout(() => {
						// Use a try-catch to prevent errors from propagating
						try {
							untrack(() => {
								console.log('[DEBUG] Calling loaded callback (cached)');
								props.loaded?.();
							});
						} catch (error) {
							console.error('[DEBUG] Error in Arrow loaded callback (cached):', error);
						}
					}, 200); // Use a longer timeout
				}
				return;
			}

			console.log('[DEBUG] No cached data found, loading SVG');
			// For real-time responsiveness, use a Promise.race approach
			// This will use either the preloaded SVG or a fast fallback if loading takes too long
			const loadPromise = svgLoader.loadSvg(
				effectiveArrowData.motionType,
				effectiveArrowData.startOri,
				effectiveArrowData.turns,
				effectiveArrowData.color,
				effectiveArrowData.svgMirrored
			);

			// Use the result as soon as it's available
			console.log('[DEBUG] Waiting for SVG load promise');
			const result = await loadPromise;
			console.log('[DEBUG] SVG loaded successfully');

			// Update state and notify with untrack to prevent reactivity loops
			untrack(() => {
				console.log('[DEBUG] Updating SVG data state');
				svgData = result.svgData;

				// Cache the result for future use
				console.log('[DEBUG] Caching SVG data');
				cacheSvgData(cacheKey, svgData);

				isLoaded = true;
			});

			// Use setTimeout to break the reactivity chain for callbacks
			if (props.loaded && !hasCalledLoaded) {
				console.log('[DEBUG] Scheduling loaded callback');
				// Set a flag to prevent multiple callbacks
				hasCalledLoaded = true;
				setTimeout(() => {
					untrack(() => {
						console.log('[DEBUG] Calling loaded callback');
						props.loaded?.();
					});
				}, 200); // Use a longer timeout to ensure all other operations complete
			}
		} catch (error) {
			console.error('[DEBUG] Error loading arrow SVG:', error);
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
			hasErrored = true;
			svgData = svgLoader.getFallbackSvgData();
			isLoaded = true;
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
		console.log('[DEBUG] Arrow component mounted');

		// Load SVG immediately if we have arrow data
		if (effectiveArrowData?.motionType && !isLoaded && !hasCalledLoaded) {
			console.log('[DEBUG] Arrow has motion type, loading SVG immediately');
			// Make a local copy to avoid reactivity issues
			const localArrowData = effectiveArrowData;

			// Set flag to prevent multiple loads
			hasCalledLoaded = true;

			// Load SVG asynchronously
			setTimeout(() => {
				// Use try-catch to prevent errors from propagating
				try {
					// Load SVG with local data
					if (localArrowData.motionType) {
						loadArrowSvg();
					}
				} catch (error) {
					console.error('[DEBUG] Error loading SVG:', error);
				}
			}, 50);
		} else if (!isLoaded) {
			console.log('[DEBUG] Arrow has no motion type, marking as loaded');
			isLoaded = true;

			// Notify parent component
			if (props.loaded && !hasCalledLoaded) {
				console.log('[DEBUG] Notifying parent about no-motion arrow');
				hasCalledLoaded = true;

				// Use a timeout to break the reactivity chain
				setTimeout(() => {
					props.loaded?.({ error: false });
				}, 50);
			}
		}
	});

	// Track previous arrow data values to detect changes
	let previousTurns: number | string | 'fl' | null = null;
	let previousPropRotDir: string | null = null;
	let previousMotionType: string | null = null;

	// DISABLED: Reactive loading effect to prevent infinite loops
	// This effect was causing infinite loops, so we've completely disabled it
	// and rely only on the onMount initialization

	// Initialize previous values in an effect to properly track state
	safeEffect(() => {
		// Only initialize once
		if (effectiveArrowData && !previousTurns) {
			// Create a local copy to avoid TypeScript errors
			const localArrowData = effectiveArrowData;
			untrack(() => {
				previousTurns = localArrowData.turns;
				previousPropRotDir = localArrowData.propRotDir;
				previousMotionType = localArrowData.motionType;
			});
		}
	});

	// DISABLED: Additional loading effects
	// We've completely disabled this effect and removed the isLoading state
	// to prevent reactivity loops. The component now uses a simpler approach
	// with timeouts and untrack() to break reactivity chains.
</script>

{#if svgData && isLoaded && effectiveArrowData}
	<g
		{transform}
		data-testid="arrow-{effectiveArrowData.color}"
		data-motion-type={effectiveArrowData.motionType}
		data-mirrored={effectiveArrowData.svgMirrored ? 'true' : 'false'}
		data-loc={effectiveArrowData.loc}
		data-rot-angle={rotationAngle}
	>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={-svgData.center.x}
			y={-svgData.center.y}
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
