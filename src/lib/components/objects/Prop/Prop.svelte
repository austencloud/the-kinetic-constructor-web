<!-- src/lib/components/objects/Prop/Prop.svelte -->
<!-- FIXED: Eliminated reactive loops and simplified state management -->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { parsePropSvg } from '../../SvgManager/PropSvgParser';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { PropData } from './PropData';
	import type { PropSvgData } from '../../SvgManager/PropSvgData';
	import PropRotAngleManager from './PropRotAngleManager';
	import { svgPreloadingService } from '$lib/services/SvgPreloadingService';

	function safeBase64Encode(str: string): string {
		try {
			return btoa(str);
		} catch (e) {
			try {
				const binaryString = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
					String.fromCharCode(parseInt(p1, 16))
				);
				return btoa(binaryString);
			} catch (fallbackError) {
				console.error('Base64 encoding failed:', fallbackError);
				return encodeURIComponent(str);
			}
		}
	}

	const props = $props<{
		propData?: PropData;
		beatId?: string;
		color?: 'red' | 'blue';
		animationDuration?: number;
		loaded?: (event: { timeout?: boolean; error?: boolean }) => void;
		error?: (event: { message: string }) => void;
		imageLoaded?: () => void;
	}>();

	// CRITICAL FIX: Simplified state - no reactive dependencies
	let svgData = $state<PropSvgData | null>(null);
	let isReady = $state(false);

	// CRITICAL FIX: Initialize everything upfront, no derived reactivity
	const effectivePropData = props.propData;
	const animationDuration = props.animationDuration ?? 200;
	let rotationAngle = $state(0);
	let svgManager: SvgManager;

	// Initialize services immediately
	if (effectivePropData) {
		svgManager = new SvgManager();
		
		// CRITICAL FIX: Calculate rotation angle once, not reactively
		try {
			const rotAngleManager = new PropRotAngleManager({
				loc: effectivePropData.loc,
				ori: effectivePropData.ori
			});
			rotationAngle = rotAngleManager.getRotationAngle();
			
			// Update prop data with calculated angle
			if (effectivePropData) {
				effectivePropData.rotAngle = rotationAngle;
			}
		} catch (error) {
			console.warn('Error calculating rotation angle:', error);
			rotationAngle = 0;
		}
	}

	// Simple cache - no reactive management
	const propSvgCache = new Map<string, PropSvgData>();

	function isInOptionPicker() {
		return animationDuration === 0 || (props.beatId === undefined && props.color === undefined);
	}

	function getPropCacheKey(propType: string, propColor: string) {
		return `prop-${propType}-${propColor}`;
	}

	// CRITICAL FIX: Simplified loading without cascading timeouts
	async function loadSvg() {
		if (!effectivePropData || isReady) return;

		try {
			const cacheKey = getPropCacheKey(effectivePropData.propType, effectivePropData.color);
			
			let cachedSvgData = propSvgCache.get(cacheKey);
			
			if (cachedSvgData) {
				untrack(() => {
					svgData = cachedSvgData;
					isReady = true;
				});
				notifyLoaded();
				return;
			}

			// Try to get from resource cache first
			const cachedSvg = await svgManager.getPropSvg(
				effectivePropData.propType,
				effectivePropData.color
			);

			if (cachedSvg) {
				const { viewBox, center } = parsePropSvg(cachedSvg, effectivePropData.color);
				
				const newSvgData = {
					imageSrc: `data:image/svg+xml;base64,${safeBase64Encode(cachedSvg)}`,
					viewBox,
					center
				};

				// Cache and update state
				propSvgCache.set(cacheKey, newSvgData);
				
				untrack(() => {
					svgData = newSvgData;
					isReady = true;
				});

				// Update center in prop data
				if (effectivePropData) {
					effectivePropData.svgCenter = center;
				}

				notifyLoaded();
			} else {
				throw new Error('Failed to load prop SVG');
			}

		} catch (error: any) {
			handleLoadError(error);
		}
	}

	function handleLoadError(error: any) {
		console.error('Error loading prop SVG:', error);

		// Create fallback SVG
		const fallbackColor = effectivePropData?.color === 'red' ? '#ED1C24' : '#2E3192';
		const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
			<rect width="100" height="100" fill="#f8f8f8" />
			<circle cx="50" cy="50" r="30" fill="${fallbackColor}" opacity="0.3" />
			<circle id="centerPoint" cx="50" cy="50" r="2" fill="${fallbackColor}" />
		</svg>`;

		untrack(() => {
			svgData = {
				imageSrc: `data:image/svg+xml;base64,${safeBase64Encode(fallbackSvg)}`,
				viewBox: { width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};
			isReady = true;
		});

		notifyLoaded(true);
	}

	// CRITICAL FIX: Single callback function, no complex timing
	function notifyLoaded(hasError = false) {
		// Use microtask to avoid immediate reactivity
		queueMicrotask(() => {
			try {
				props.loaded?.({ error: hasError });
			} catch (error) {
				console.error('Error in Prop loaded callback:', error);
			}
		});
	}

	// CRITICAL FIX: Simple onMount - no reactive dependencies
	onMount(() => {
		if (effectivePropData?.propType) {
			// Check preloading status once, then load
			const isPreloaded = svgPreloadingService.arePropsReady();
			const delay = isPreloaded ? 0 : 50;
			
			if (delay === 0) {
				loadSvg();
			} else {
				setTimeout(() => loadSvg(), delay);
			}
		} else {
			// No prop data - mark as ready immediately
			isReady = true;
			notifyLoaded(true);
		}
	});

	function handleImageLoad() {
		props.imageLoaded?.();
	}

	function handleImageError() {
		props.error?.({ message: 'Image failed to load' });
	}
</script>

<!-- CRITICAL FIX: Simplified template -->
{#if svgData && isReady && effectivePropData}
	<g>
		<image
			href={svgData.imageSrc}
			transform="
				translate({effectivePropData.coords.x}, {effectivePropData.coords.y})
				rotate({rotationAngle})
				translate({-svgData.center.x}, {-svgData.center.y})
			"
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			preserveAspectRatio="xMidYMid meet"
			onload={handleImageLoad}
			onerror={handleImageError}
		/>
	</g>
{/if}