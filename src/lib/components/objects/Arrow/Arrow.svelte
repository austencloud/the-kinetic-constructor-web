<!-- src/lib/components/objects/Arrow/Arrow.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
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
	export let arrowData: ArrowData | undefined = undefined;
	export let beatId: string | undefined = undefined;
	export let color: 'red' | 'blue' | undefined = undefined;
	export let motion: Motion | null = null;
	export let pictographData: PictographData | null = null;
	export let pictographService: PictographService | null = null;
	export let loadTimeoutMs = 1000; // Configurable timeout

	// Get arrow data from the sequence store if beatId and color are provided
	const arrowDataFromStore = derived(sequenceStore, ($sequenceStore) => {
		if (!beatId || !color) return null;

		const beat = $sequenceStore.beats.find((b) => b.id === beatId);
		if (!beat) return null;

		return color === 'red' ? beat.redArrowData : beat.blueArrowData;
	});

	// Use either the arrow data from store or the directly provided arrow data
	$: effectiveArrowData = $arrowDataFromStore || arrowData;

	// Component state
	let svgData: ArrowSvgData | null = null;
	let transform = '';
	let isLoaded = false;
	let hasErrored = false;
	let loadTimeout: NodeJS.Timeout;
	let rotAngleManager: ArrowRotAngleManager | null = null;

	// Services
	const dispatch = createEventDispatcher();
	const svgManager = new SvgManager();
	const svgLoader = new ArrowSvgLoader(svgManager);

	// Create mirror manager only when we have arrow data
	$: mirrorManager = effectiveArrowData ? new ArrowSvgMirrorManager(effectiveArrowData) : null;

	// Initialize the rotation angle manager when pictograph data is available
	$: if (pictographData) {
		rotAngleManager = new ArrowRotAngleManager(pictographData, pictographService || undefined);
	}

	// Update mirror state whenever motion data or arrow data changes
	$: if (effectiveArrowData && mirrorManager) {
		mirrorManager.updateMirror();
	}

	// Calculate rotation angle (memoized)
	$: rotationAngle = getRotationAngle();

	// Transform calculation (memoized)
	$: if (svgData && effectiveArrowData?.coords) {
		// Apply transformations in the correct order
		const mirrorTransform = effectiveArrowData.svgMirrored ? 'scale(-1, 1)' : '';

		transform = `
			translate(${effectiveArrowData.coords.x}, ${effectiveArrowData.coords.y})
			rotate(${rotationAngle})
			${mirrorTransform}
		`.trim();
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

			// Set safety timeout
			loadTimeout = setTimeout(() => {
				if (!isLoaded) {
					console.warn(`Arrow loading timed out after ${loadTimeoutMs}ms`);
					isLoaded = true;
					dispatch('loaded', { timeout: true });
				}
			}, loadTimeoutMs);

			// Update mirror state before loading SVG
			if (mirrorManager) {
				mirrorManager.updateMirror();
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
			clearTimeout(loadTimeout);
			isLoaded = true;
			dispatch('loaded');
		} catch (error) {
			handleLoadError(error);
		}
	}

	/**
	 * Handles SVG loading errors with fallback
	 */
	function handleLoadError(error: unknown) {
		console.error('Arrow load error:', error);
		hasErrored = true;
		svgData = svgLoader.getFallbackSvgData();
		clearTimeout(loadTimeout);
		isLoaded = true;
		dispatch('loaded', { error: true });
		dispatch('error', {
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
			dispatch('loaded', { error: true });
		}

		// Cleanup
		return () => clearTimeout(loadTimeout);
	});

	// Reactive loading
	$: {
		if (effectiveArrowData?.motionType && !isLoaded && !hasErrored) {
			loadArrowSvg();
		}
	}
</script>

{#if svgData && isLoaded && effectiveArrowData}
	<g
		{transform}
		data-testid="arrow-{effectiveArrowData.color}"
		data-motion-type={effectiveArrowData.motionType}
		data-mirrored={effectiveArrowData.svgMirrored ? 'true' : 'false'}
		data-loc={effectiveArrowData.loc}
		data-rot-angle={rotationAngle}
		in:fade={{ duration: 300 }}
	>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={-svgData.center.x}
			y={-svgData.center.y}
			aria-label="Arrow showing {effectiveArrowData.motionType} motion in {effectiveArrowData.color} direction"
			role="img"
			on:load={() => dispatch('imageLoaded')}
			on:error={() => dispatch('error', { message: 'Image failed to load' })}
		/>
	</g>
{/if}
