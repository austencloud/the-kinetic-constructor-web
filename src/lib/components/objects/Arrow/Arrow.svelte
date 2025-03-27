<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { ArrowData } from './ArrowData';
	import type { ArrowSvgData } from '../../SvgManager/ArrowSvgData';
	import { parseArrowSvg } from '../../SvgManager/parseArrowSvg';
	import SvgManager from '../../SvgManager/SvgManager';

	export let arrowData: ArrowData;

	let svgData: ArrowSvgData | null = null;
	let transform = '';
	let isLoaded = false;
	let hasErrored = false;

	const svgManager = new SvgManager();

	// Create event dispatcher for load events
	const dispatch = createEventDispatcher();

	// For tracking load state
	let loadTimeout: number;


	// Load the SVG and set up its data
	const loadArrowSvg = async () => {
		try {

			// Set a timeout to ensure we don't get stuck in loading state
			loadTimeout = setTimeout(() => {
				if (!isLoaded) {
					isLoaded = true;
					dispatch('loaded', { timeout: true });
				}
			}, 10);

			const svgText = await svgManager.getArrowSvg(
				arrowData.motionType, // ✅ Use stored motionType
				arrowData.startOri, // ✅ Use stored startOri
				arrowData.turns, // ✅ Use stored turns
				arrowData.color
			);

			if (!svgText?.includes('<svg')) {
				throw new Error('Invalid SVG content: Missing <svg> element');
			}

			const originalSvgData = parseArrowSvg(svgText);

			// Adjust center point if mirrored
			const center = { ...originalSvgData.center };
			if (arrowData.svgMirrored) {
				center.x = originalSvgData.viewBox.width - center.x;
			}

			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox: originalSvgData.viewBox,
				center
			};

			// Clear timeout as we've loaded successfully
			clearTimeout(loadTimeout);


			// Mark as loaded immediately
			isLoaded = true;
			dispatch('loaded');
		} catch (error) {
			hasErrored = true;

			// Use a fallback SVG for errors
			svgData = {
				imageSrc:
					'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIgLz48dGV4dCB4PSIyMCIgeT0iNTAiIGZpbGw9IiNmMDAiPkVycm9yPC90ZXh0Pjwvc3ZnPg==',
				viewBox: { x: 0, y: 0, width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};

			// Even if we fail, mark as loaded so we don't block the UI
			clearTimeout(loadTimeout);
			isLoaded = true;
			dispatch('loaded', { error: true });
			dispatch('error', { message: (error as Error)?.message || 'Unknown error' });
		}
	};

	// Trigger the SVG load when mounted or when properties change
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

	$: {
		if (arrowData.motionType && !isLoaded && !hasErrored) {
			loadArrowSvg();
		}
	}

	$: if (svgData && (arrowData.coords || arrowData.rotAngle || arrowData.svgMirrored)) {
		const mirrorTransform = arrowData.svgMirrored ? `scale(-1, 1)` : '';

		transform = `
			translate(${arrowData.coords.x}, ${arrowData.coords.y})
			rotate(${arrowData.rotAngle})
			${mirrorTransform}
		`;
	}

	// Handle image load events
	function handleImageLoad() {
		dispatch('imageLoaded');
	}

	// Handle image load errors
	function handleImageError(e: Event) {
		const errorEvent = e as ErrorEvent;
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
