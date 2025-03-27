<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { parsePropSvg } from '../../SvgManager/PropSvgParser';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { PropData } from './PropData';
	import type { PropSvgData } from '../../SvgManager/PropSvgData';
	import { rotateOffset } from './rotationUtils';
	import PropRotAngleManager from './PropRotAngleManager';
	import { PropChecker } from './PropChecker';

	export let propData: PropData;
    console.log("📦 Received Prop Data:", propData);

	let transform = '';
	let svgData: PropSvgData | null = null;
	let coords = { x: 0, y: 0 };
	let checker = propData ? new PropChecker(propData) : null;
	let isLoaded = false;
	let hasErrored = false;
	
	const dispatch = createEventDispatcher();
	
	// For tracking load state
	let loadTimeout: number;
	
	// For debugging
	function logDebug(message: string) {
	  console.log(`[Prop ${propData.color}] ${message}`);
	}

	const svgManager = new SvgManager();

	// Load SVG and update svgData
	const loadSvg = async () => {
		try {
			logDebug('Loading SVG...');
			
			// Set a timeout to ensure we don't get stuck in loading state
			loadTimeout = setTimeout(() => {
				if (!isLoaded) {
					logDebug('⚠️ Prop load timeout triggered');
					isLoaded = true;
					dispatch('loaded', { timeout: true });
				}
			}, 3000);
			
			const svgText = await svgManager.getPropSvg(propData.propType, propData.color);
			const { viewBox, center } = parsePropSvg(svgText);

			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};

			propData.svgCenter = center;
			
			// Clear timeout as we've loaded successfully
			clearTimeout(loadTimeout);
			
			// Mark as loaded immediately to ensure we don't block rendering
			isLoaded = true;
			
			logDebug('✅ SVG loaded successfully');
			dispatch('loaded');
		} catch (error: any) {
			logDebug(`❌ Prop load failed: ${error}`);
			hasErrored = true;
			
			// Use a fallback SVG for errors
			svgData = {
				imageSrc: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIgLz48dGV4dCB4PSIyMCIgeT0iNTAiIGZpbGw9IiNmMDAiPkVycm9yPC90ZXh0Pjwvc3ZnPg==',
				viewBox: { width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};
			
			// Even if we fail, mark as loaded so we don't block the UI
			clearTimeout(loadTimeout);
			isLoaded = true;
			dispatch('loaded', { error: true });
			dispatch('error', { message: (error as Error)?.message || 'Unknown error' });
		}
	};

	onMount(() => {
		logDebug('Component mounted');
		
		if (propData.propType) {
			loadSvg();
		} else {
			logDebug('⚠️ No prop type provided');
			isLoaded = true;
			dispatch('loaded', { error: true });
		}
		
		return () => {
			clearTimeout(loadTimeout);
		};
	});

	$: {
		if (propData.propType || propData.color) {
			if (!isLoaded && !hasErrored) {
				loadSvg();
			}
		}
	}

	$: coords = svgData
		? rotateOffset({ x: -svgData.center.x, y: -svgData.center.y }, -propData.rotAngle)
		: { x: 0, y: 0 };

	$: transform =
		svgData && (propData.loc || propData.ori) // ✅ Use stored values instead of motion reference
			? (() => {
					const rotAngleManager = new PropRotAngleManager({
						loc: propData.loc, // ✅ Use `propData.loc`
						ori: propData.ori  // ✅ Use `propData.ori`
					});
					propData.rotAngle = rotAngleManager.getRotationAngle();
					return `translate(${propData.coords.x} ${propData.coords.y})
					rotate(${propData.rotAngle} ${svgData.center.x} ${svgData.center.y})`;
				})()
			: '';
			
	// Handle image load events
	function handleImageLoad() {
		logDebug('Image loaded');
		dispatch('imageLoaded');
	}
	
	// Handle image load errors
	function handleImageError(e: Event) {
		const errorEvent = e as ErrorEvent;
		logDebug(`❌ Image load error: ${errorEvent.message || e}`);
		dispatch('error', { message: 'Image failed to load' });
	}
</script>

{#if svgData && isLoaded}
	<g {transform}>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={coords.x}
			y={coords.y}
			preserveAspectRatio="xMidYMid meet"
			on:load={handleImageLoad}
			on:error={handleImageError}
		/>
	</g>
{/if}