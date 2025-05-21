<!-- src/lib/components/objects/Arrow/Arrow.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { ArrowData } from './ArrowData';
	import type { ArrowSvgData } from '../../SvgManager/ArrowSvgData';
	import { ArrowSvgLoader } from './services/ArrowSvgLoader';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { Motion } from '../Motion/Motion';
	import ArrowRotAngleManager from './ArrowRotAngleManager';
	import ArrowSvgMirrorManager from './ArrowSvgMirrorManager';
	import type { PictographService } from '$lib/components/Pictograph/PictographService';
	import type { PictographData } from '$lib/types/PictographData';
	import { sequenceStore } from '$lib/state/stores/sequenceStore';
	import { derived } from 'svelte/store';

	// Props - we support both direct arrowData and store-based approach
	const props = $props<{
		arrowData?: ArrowData;
		beatId?: string;
		color?: 'red' | 'blue';
		motion?: Motion | null;
		pictographData?: PictographData | null;
		pictographService?: PictographService | null;
		loadTimeoutMs?: number;
		animationDuration?: number;

		// Event handlers
		loaded?: (event: { timeout?: boolean; error?: boolean }) => void;
		error?: (event: { message: string; component: string; color: string }) => void;
		imageLoaded?: () => void;
	}>();

	// Set defaults
	const arrowData = props.arrowData;
	const beatId = props.beatId;
	const color = props.color;
	const motion = props.motion ?? null;
	const pictographData = props.pictographData ?? null;
	const pictographService = props.pictographService ?? null;
	const loadTimeoutMs = props.loadTimeoutMs ?? 1000; // Configurable timeout
	// Animation duration is passed from parent but not used directly in this component
	const animationDuration = props.animationDuration ?? 200;

	// Get arrow data from the sequence store if beatId and color are provided
	const arrowDataFromStore = derived(sequenceStore, ($sequenceStore) => {
		if (!beatId || !color) return null;

		const beat = $sequenceStore.beats.find((b) => b.id === beatId);
		if (!beat) return null;

		return color === 'red' ? beat.redArrowData : beat.blueArrowData;
	});

	// Use either the arrow data from store or the directly provided arrow data
	let effectiveArrowData = $state<ArrowData | undefined>(undefined);

	// Update effectiveArrowData when arrowDataFromStore changes
	$effect(() => {
		effectiveArrowData = $arrowDataFromStore || arrowData;
	});

	// Component state
	let svgData = $state<ArrowSvgData | null>(null);
	let transform = $state('');
	let isLoaded = $state(false);
	let hasErrored = $state(false);
	let loadTimeout: NodeJS.Timeout;
	let rotAngleManager = $state<ArrowRotAngleManager | null>(null);

	// Services
	const svgManager = new SvgManager();
	const svgLoader = new ArrowSvgLoader(svgManager);

	// Create mirror manager only when we have arrow data
	let mirrorManager = $state<ArrowSvgMirrorManager | null>(null);

	$effect(() => {
		mirrorManager = effectiveArrowData ? new ArrowSvgMirrorManager(effectiveArrowData) : null;
	});

	// Initialize the rotation angle manager when pictograph data is available
	$effect(() => {
		if (pictographData) {
			rotAngleManager = new ArrowRotAngleManager(pictographData, pictographService || undefined);
		}
	});

	// Update mirror state whenever motion data or arrow data changes
	$effect(() => {
		if (effectiveArrowData && mirrorManager) {
			mirrorManager.updateMirror();
		}
	});

	// Calculate rotation angle (memoized)
	let rotationAngle = $state(0);

	$effect(() => {
		rotationAngle = getRotationAngle();
	});

	// Transform calculation (memoized)
	$effect(() => {
		if (svgData && effectiveArrowData?.coords) {
			// Apply transformations in the correct order
			const mirrorTransform = effectiveArrowData.svgMirrored ? 'scale(-1, 1)' : '';

			transform = `
				translate(${effectiveArrowData.coords.x}, ${effectiveArrowData.coords.y})
				rotate(${rotationAngle})
				${mirrorTransform}
			`.trim();
		}
	});

	/**
	 * Helper function to detect mobile devices
	 */
	function isMobile(): boolean {
		return (
			typeof window !== 'undefined' &&
			(window.innerWidth <= 768 ||
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
		);
	}

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
	 * Loads the arrow SVG with error handling and timeout
	 */
	async function loadArrowSvg() {
		try {
			// Safety check
			if (!effectiveArrowData) {
				throw new Error('No arrow data available');
			}

			// Check if we're in OptionPicker context
			const isInOptionPicker =
				props.loadTimeoutMs === 10 ||
				(props.pictographService === null && props.pictographData === null);

			// For OptionPicker, use a much shorter timeout and prioritize immediate rendering
			const timeoutDuration = isInOptionPicker
				? 10 // Very short timeout for OptionPicker
				: isMobile()
					? loadTimeoutMs * 2
					: loadTimeoutMs;

			// Set safety timeout
			loadTimeout = setTimeout(() => {
				if (!isLoaded) {
					// Use less verbose logging in production
					if (import.meta.env.DEV) {
						console.warn(`Arrow loading timed out after ${timeoutDuration}ms`);
					}
					isLoaded = true;
					props.loaded?.({ timeout: true });
				}
			}, timeoutDuration);

			// Update mirror state before loading SVG
			if (mirrorManager) {
				mirrorManager.updateMirror();
			}

			// Use a more specific cache key for OptionPicker to avoid conflicts
			const cacheKey = isInOptionPicker
				? `option-picker-arrow-${effectiveArrowData.motionType}-${effectiveArrowData.turns}-${effectiveArrowData.propRotDir}`
				: `arrow-${effectiveArrowData.motionType}-${effectiveArrowData.startOri}-${effectiveArrowData.turns}-${effectiveArrowData.color}-${effectiveArrowData.svgMirrored}`;

			const cachedData = getCachedSvgData(cacheKey);

			if (cachedData) {
				// Use cached data
				svgData = cachedData;
				clearTimeout(loadTimeout);
				isLoaded = true;
				props.loaded?.();
				return;
			}

			// Load the SVG with current configuration
			const result = await svgLoader.loadSvg(
				effectiveArrowData.motionType,
				effectiveArrowData.startOri,
				effectiveArrowData.turns,
				effectiveArrowData.color,
				effectiveArrowData.svgMirrored
			);

			// Update state and notify
			svgData = result.svgData;

			// Cache the result for future use
			cacheSvgData(cacheKey, svgData);

			clearTimeout(loadTimeout);
			isLoaded = true;
			props.loaded?.();
		} catch (error) {
			handleLoadError(error);
		}
	}

	/**
	 * Handles SVG loading errors with fallback
	 */
	function handleLoadError(error: unknown) {
		// Minimal logging in production
		if (import.meta.env.DEV) {
			console.error('Arrow load error:', error);
		} else {
			console.error('Arrow load error: ' + ((error as Error)?.message || 'Unknown error'));
		}

		hasErrored = true;
		svgData = svgLoader.getFallbackSvgData();
		clearTimeout(loadTimeout);
		isLoaded = true;
		props.loaded?.({ error: true });
		props.error?.({
			message: (error as Error)?.message || 'Unknown error',
			component: 'Arrow',
			color: effectiveArrowData?.color || 'unknown'
		});
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

	// Lifecycle hooks
	onMount(() => {
		if (effectiveArrowData?.motionType) {
			loadArrowSvg();
		} else {
			isLoaded = true;
			props.loaded?.({ error: true });
		}

		// Cleanup
		return () => clearTimeout(loadTimeout);
	});

	// Track previous turns value to detect changes
	let previousTurns: number | string | 'fl' | null = null;
	let turnsChangeDebounceTimer: number | null = null;

	// Reactive loading with debouncing
	$effect(() => {
		// Skip this effect if we're in a Pictograph with disableAnimations=true
		// This is a common case in the OptionPicker where we don't need to reload on turns changes
		const isInOptionPicker =
			props.loadTimeoutMs === 10 ||
			(props.pictographService === null && props.pictographData === null);

		// For OptionPicker, we want to completely skip the animation and debouncing
		if (isInOptionPicker) {
			// Just update the previous turns value without triggering a reload
			if (effectiveArrowData?.turns !== undefined) {
				previousTurns = effectiveArrowData.turns;
			}

			// Force immediate load without animation for OptionPicker
			if (!isLoaded && effectiveArrowData?.motionType) {
				loadArrowSvg();
			}

			return;
		}

		// Force reload when turns change, but debounce to avoid excessive reloads
		if (effectiveArrowData?.turns !== previousTurns && previousTurns !== null) {
			// Clear any existing debounce timer
			if (turnsChangeDebounceTimer !== null && typeof window !== 'undefined') {
				window.clearTimeout(turnsChangeDebounceTimer);
			}

			// Use requestAnimationFrame for smoother updates
			if (typeof window !== 'undefined') {
				requestAnimationFrame(() => {
					// Set a short debounce to batch multiple turns changes
					turnsChangeDebounceTimer = window.setTimeout(() => {
						// Reset state to force reload
						isLoaded = false;
						hasErrored = false;
						svgData = null;

						// Load the SVG immediately
						if (effectiveArrowData?.motionType) {
							loadArrowSvg();
						}

						// Clear the timer reference
						turnsChangeDebounceTimer = null;
					}, 50); // Short debounce time
				});
			}
		}

		// Update previous turns value
		if (effectiveArrowData?.turns !== undefined) {
			previousTurns = effectiveArrowData.turns;
		}
	});

	// Load SVG if needed
	$effect(() => {
		// Load SVG if needed and not already loading
		if (
			effectiveArrowData?.motionType &&
			!isLoaded &&
			!hasErrored &&
			turnsChangeDebounceTimer === null
		) {
			loadArrowSvg();
		}
	});
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
