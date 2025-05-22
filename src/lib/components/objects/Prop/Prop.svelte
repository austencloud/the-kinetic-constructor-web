<script lang="ts">
	import { onMount } from 'svelte';
	import { parsePropSvg } from '../../SvgManager/PropSvgParser';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { PropData } from './PropData';
	import type { PropSvgData } from '../../SvgManager/PropSvgData';
	import PropRotAngleManager from './PropRotAngleManager';
	import { sequenceStore } from '$lib/state/stores/sequenceStore';

	// Props using Svelte 5 runes
	const props = $props<{
		propData?: PropData;
		beatId?: string;
		color?: 'red' | 'blue';
		animationDuration?: number;

		// Event handlers
		loaded?: (event: { timeout?: boolean; error?: boolean }) => void;
		error?: (event: { message: string }) => void;
		imageLoaded?: () => void;
	}>();

	// Set defaults
	const propData = props.propData;
	const beatId = props.beatId;
	const color = props.color;
	const animationDuration = props.animationDuration ?? 200;

	// Component state
	let svgData = $state<PropSvgData | null>(null);
	let isLoaded = $state(false);
	let loadTimeout: ReturnType<typeof setTimeout>;
	let rotAngle = $state(0);

	// Services
	const svgManager = new SvgManager();

	// Use the directly provided prop data as the base
	let effectivePropData = $state<PropData | undefined>(propData);

	// Subscribe to the sequence store to update effectivePropData if needed
	$effect(() => {
		// Only subscribe if we have beatId and color
		if (!beatId || !color) return;

		// Subscribe to the sequence store
		const unsubscribe = sequenceStore.subscribe(($sequenceStore) => {
			const beat = $sequenceStore.beats.find((b) => b.id === beatId);
			if (!beat) return;

			const storeData = color === 'red' ? beat.redPropData : beat.bluePropData;
			if (storeData) {
				effectivePropData = storeData;
			}
		});

		return unsubscribe; // Cleanup function
	});

	// Compute rotation angle using $effect
	$effect(() => {
		// Ensure we have both loc and ori, and the SVG is loaded
		if (effectivePropData) {
			// Always try to calculate, even if loc or ori might be undefined
			try {
				const rotAngleManager = new PropRotAngleManager({
					loc: effectivePropData.loc,
					ori: effectivePropData.ori
				});

				// Update rotAngle even if loc or ori are potentially undefined
				rotAngle = rotAngleManager.getRotationAngle();

				// Update the rotation angle in the prop data
				if (propData) {
					propData.rotAngle = rotAngle;
				}

				// If using store data and we need to update it, we would do it here
				// This would require implementing an update function that uses sequenceStore.updateBeat
			} catch (error) {
				console.warn('Error calculating rotation angle:', error);
			}
		}
	});

	// Static component-level cache for all props
	const propSvgCache = new Map<string, PropSvgData>();

	// Function to check if we're in OptionPicker context
	function isInOptionPicker() {
		return animationDuration === 0 || (beatId === undefined && color === undefined);
	}

	// Function to get cache key for a prop
	function getPropCacheKey(propType: string, propColor: string) {
		return `prop-${propType}-${propColor}`;
	}

	onMount(() => {
		if (effectivePropData?.propType) {
			loadSvg();
		} else {
			isLoaded = true;
			props.loaded?.({ error: true });
		}

		return () => {
			clearTimeout(loadTimeout);
		};
	});

	async function loadSvg() {
		try {
			// Safety check
			if (!effectivePropData) {
				throw new Error('No prop data available');
			}

			// Create a consistent cache key
			const cacheKey = getPropCacheKey(effectivePropData.propType, effectivePropData.color);

			// First check the component-level cache
			if (propSvgCache.has(cacheKey)) {
				svgData = propSvgCache.get(cacheKey)!;
				isLoaded = true;
				props.loaded?.({});
				return;
			}

			// Then check the resource cache via SvgManager
			// This will be populated if props were preloaded at app startup
			try {
				const cachedSvg = await svgManager.getPropSvg(
					effectivePropData.propType,
					effectivePropData.color
				);

				if (cachedSvg) {
					const { viewBox, center } = parsePropSvg(cachedSvg, effectivePropData.color);

					svgData = {
						imageSrc: `data:image/svg+xml;base64,${btoa(cachedSvg)}`,
						viewBox,
						center
					};

					// Cache for future use
					propSvgCache.set(cacheKey, svgData);

					isLoaded = true;
					props.loaded?.({});
					return;
				}
			} catch (cacheError) {
				// Continue with normal loading if cache check fails
				console.debug('Cache miss for prop SVG, loading directly:', cacheError);
			}

			// Set a timeout for loading - longer for mobile
			const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
			const timeoutDuration = isInOptionPicker() ? 5 : isMobileDevice ? 3000 : 1000;

			loadTimeout = setTimeout(() => {
				if (!isLoaded) {
					isLoaded = true;
					props.loaded?.({ timeout: true });
				}
			}, timeoutDuration);

			const svgText = await svgManager.getPropSvg(
				effectivePropData.propType,
				effectivePropData.color
			);
			const { viewBox, center } = parsePropSvg(svgText, effectivePropData.color);

			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};

			// Cache the result for OptionPicker
			if (isInOptionPicker() && effectivePropData) {
				const cacheKey = getPropCacheKey(effectivePropData.propType, effectivePropData.color);
				propSvgCache.set(cacheKey, svgData);
			}

			// Update the center in the prop data if it's directly provided
			if (propData) {
				propData.svgCenter = center;
			}

			clearTimeout(loadTimeout);
			isLoaded = true;
			props.loaded?.({});
		} catch (error: any) {
			console.error('Error loading prop SVG:', error);

			// Fallback SVG for error state
			svgData = {
				imageSrc:
					'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIgLz48dGV4dCB4PSIyMCIgeT0iNTAiIGZpbGw9IiNmMDAiPkVycm9yPC90ZXh0Pjwvc3ZnPg==',
				viewBox: { width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};

			clearTimeout(loadTimeout);
			isLoaded = true;
			props.loaded?.({ error: true });
			props.error?.({ message: (error as Error)?.message || 'Unknown error' });
		}
	}

	function handleImageLoad() {
		props.imageLoaded?.();
	}
	function handleImageError() {
		props.error?.({ message: 'Image failed to load' });
	}
</script>

<!-- No nested transforms - just directly place everything with proper attributes -->
{#if svgData && isLoaded && effectivePropData}
	<g>
		<image
			href={svgData.imageSrc}
			transform="
				translate({effectivePropData.coords.x}, {effectivePropData.coords.y})
				rotate({rotAngle})
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
