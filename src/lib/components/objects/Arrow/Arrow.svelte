<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { ArrowData } from './ArrowData';
	import type { ArrowSvgData } from '../../SvgManager/ArrowSvgData';
	import { ArrowSvgLoader } from './services/ArrowSvgLoader';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { Motion } from '../Motion/Motion';
	import { calculateArrowRotationAngle } from './ArrowRotAngleManager/arrowRotationUtils';

	export let arrowData: ArrowData;
	export let motion: Motion | null = null;

	let svgData: ArrowSvgData | null = null;
	let transform = '';
	let isLoaded = false;
	let hasErrored = false;
	const dispatch = createEventDispatcher();
	let loadTimeout: NodeJS.Timeout;

	const svgManager = new SvgManager();
	const svgLoader = new ArrowSvgLoader(svgManager);

	async function loadArrowSvg() {
		try {
			loadTimeout = setTimeout(() => {
				if (!isLoaded) {
					isLoaded = true;
					dispatch('loaded', { timeout: true });
				}
			}, 1000);

			const result = await svgLoader.loadSvg(
				arrowData.motionType,
				arrowData.startOri,
				arrowData.turns,
				arrowData.color,
				arrowData.svgMirrored
			);

			svgData = result.svgData;
			clearTimeout(loadTimeout);
			isLoaded = true;
			dispatch('loaded');
		} catch (error) {
			handleLoadError(error);
		}
	}

	function handleLoadError(error: unknown) {
		hasErrored = true;
		svgData = svgLoader.getFallbackSvgData();
		clearTimeout(loadTimeout);
		isLoaded = true;
		dispatch('loaded', { error: true });
		dispatch('error', { message: (error as Error)?.message || 'Unknown error' });
	}

	function getRotationAngle(): number {
		if (motion) {
			return calculateArrowRotationAngle(motion, arrowData.loc);
		}
		return arrowData.rotAngle;
	}

	onMount(() => {
		if (arrowData.motionType) {
			loadArrowSvg();
		} else {
			isLoaded = true;
			dispatch('loaded', { error: true });
		}

		return () => clearTimeout(loadTimeout);
	});

	$: {
		if (arrowData.motionType && !isLoaded && !hasErrored) {
			loadArrowSvg();
		}
	}

	$: if (svgData && (arrowData.coords || motion || arrowData.svgMirrored)) {
		const mirrorTransform = arrowData.svgMirrored ? `scale(-1, 1)` : '';
		const rotAngle = getRotationAngle();

		transform = `
			translate(${arrowData.coords.x}, ${arrowData.coords.y})
			rotate(${rotAngle})
			${mirrorTransform}
		`;
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
			on:load={() => dispatch('imageLoaded')}
			on:error={() => dispatch('error', { message: 'Image failed to load' })}
		/>
	</g>
{/if}
