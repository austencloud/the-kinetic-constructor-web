<!-- Prop.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { parsePropSvg } from '../../SvgManager/PropSvgParser';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { PropData } from './PropData';
	import type { PropSvgData } from '../../SvgManager/PropSvgData';
	import PropRotAngleManager from './PropRotAngleManager';
	import { PropChecker } from './PropChecker';

	export let propData: PropData;

	let svgData: PropSvgData | null = null;
	let checker = propData ? new PropChecker(propData) : null;
	let isLoaded = false;
	let hasErrored = false;
	let loadTimeout: number;
	let rotAngle = 0;

	// These two lines are new:
	let offsetX = 0;
	let offsetY = 0;

	const dispatch = createEventDispatcher();
	const svgManager = new SvgManager();

	onMount(() => {
		if (propData.propType) {
			loadSvg();
		} else {
			isLoaded = true;
			dispatch('loaded', { error: true });
		}

		return () => {
			clearTimeout(loadTimeout);
		};
	});

	async function loadSvg() {
		try {
			console.debug('Loading SVG...');
			loadTimeout = setTimeout(() => {
				if (!isLoaded) {
					isLoaded = true;
					dispatch('loaded', { timeout: true });
				}
			}, 10);

			// Fetch + parse the SVG
			const svgText = await svgManager.getPropSvg(propData.propType, propData.color);
			const { viewBox, center } = parsePropSvg(svgText, propData.color);
			console.log('Parsed center from parsePropSvg =', center);

			console.log(`📊 ${propData.color} prop SVG center: (${center.x}, ${center.y})`);

			// Update your propData with the found center
			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};
			propData.svgCenter = center;

			clearTimeout(loadTimeout);
			isLoaded = true;
			console.debug('✅ SVG loaded successfully');
			dispatch('loaded');
		} catch (error: any) {
			console.debug(`❌ Prop load failed: ${error}`);
			hasErrored = true;

			// Fallback so we at least display something
			svgData = {
				imageSrc:
					'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIgLz48dGV4dCB4PSIyMCIgeT0iNTAiIGZpbGw9IiNmMDAiPkVycm9yPC90ZXh0Pjwvc3ZnPg==',
				viewBox: { width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};

			clearTimeout(loadTimeout);
			isLoaded = true;
			dispatch('loaded', { error: true });
			dispatch('error', { message: (error as Error)?.message || 'Unknown error' });
		}
	}

	// REACTIVE: Once svgData is set, compute your rotation & offsets
	$: if (svgData) {
		// 1) rotation angle
		const rotAngleManager = new PropRotAngleManager({ loc: propData.loc, ori: propData.ori });
		rotAngle = rotAngleManager.getRotationAngle();
		propData.rotAngle = rotAngle;

		// 2) offsets to center the image around (0,0)
		offsetX = -svgData.center.x;
		offsetY = -svgData.center.y;
	}

	function handleImageLoad() {
		dispatch('imageLoaded');
	}
	function handleImageError() {
		dispatch('error', { message: 'Image failed to load' });
	}
</script>

{#if svgData && isLoaded}
	<g
		transform="
		translate({propData.coords.x} {propData.coords.y})
		rotate({rotAngle} 0 0)
	  "
	>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={offsetX}
			y={offsetY}
			preserveAspectRatio="xMidYMid meet"
			on:load={handleImageLoad}
			on:error={handleImageError}
		/>
	</g>
{/if}
