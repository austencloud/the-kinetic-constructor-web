// src/lib/components/objects/Arrow/Arrow.svelte
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { ArrowData } from './ArrowData';
	import type { ArrowSvgData } from '../../SvgManager/ArrowSvgData';
	import { parseArrowSvg } from '../../SvgManager/parseArrowSvg';
	import SvgManager from '../../SvgManager/SvgManager';
	import { ArrowSvgLoader } from './services/ArrowSvgLoader';

	export let arrowData: ArrowData;

	let svgData: ArrowSvgData | null = null;
	let transform = '';
	let isLoaded = false;
	let hasErrored = false;

	// Create event dispatcher for component events
	const dispatch = createEventDispatcher();
	
	// For tracking load timeout
	let loadTimeout: NodeJS.Timeout;
	
	// Service instances
	const svgManager = new SvgManager();
	const svgLoader = new ArrowSvgLoader(svgManager);

	// Load the SVG and set up its data
	const loadArrowSvg = async () => {
		try {
			// Set a timeout to ensure we don't hang in loading state
			loadTimeout = setTimeout(() => {
				if (!isLoaded) {
					isLoaded = true;
					dispatch('loaded', { timeout: true });
				}
			}, 10);

			// Load the SVG using the loader service
			const result = await svgLoader.loadSvg(
				arrowData.motionType,
				arrowData.startOri,
				arrowData.turns,
				arrowData.color,
				arrowData.svgMirrored
			);
			
			svgData = result.svgData;

			// Clear timeout as we've loaded successfully
			clearTimeout(loadTimeout);

			// Mark as loaded and dispatch event
			isLoaded = true;
			dispatch('loaded');
		} catch (error) {
			hasErrored = true;
			
			// Use a fallback SVG for errors
			svgData = svgLoader.getFallbackSvgData();

			// Even if we fail, mark as loaded so we don't block the UI
			clearTimeout(loadTimeout);
			isLoaded = true;
			dispatch('loaded', { error: true });
			dispatch('error', { message: (error as Error)?.message || 'Unknown error' });
		}
	};

	// Trigger SVG load when mounted
	onMount(() => {
		if (arrowData.motionType) {
			loadArrowSvg();
		} else {
			isLoaded = true;
			dispatch('loaded', { error: true });
		}

		return () => {
			clearTimeout(loadTimeout);
		};
	});

	// Reactive statements
	$: {
		// Reload if motion type changes and not yet loaded
		if (arrowData.motionType && !isLoaded && !hasErrored) {
			loadArrowSvg();
		}
	}

	$: if (svgData && (arrowData.coords || arrowData.rotAngle || arrowData.svgMirrored)) {
		// Calculate transform for positioning and mirroring
		const mirrorTransform = arrowData.svgMirrored ? `scale(-1, 1)` : '';

		transform = `
			translate(${arrowData.coords.x}, ${arrowData.coords.y})
			rotate(${arrowData.rotAngle})
			${mirrorTransform}
		`;
	}

	// Handle image events
	function handleImageLoad() {
		dispatch('imageLoaded');
	}

	function handleImageError() {
		dispatch('error', { message: 'Image failed to load' });
	}
</script>

{#if svgData && isLoaded}
	<g {transform}>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={-svgData.center.x}
			y={-svgData.center.y}
			on:load={handleImageLoad}
			on:error={handleImageError}
		/>
	</g>
{/if}