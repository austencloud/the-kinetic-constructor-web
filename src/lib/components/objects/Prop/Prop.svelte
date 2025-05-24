<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { parsePropSvg } from '../../SvgManager/PropSvgParser';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { PropData } from './PropData';
	import type { PropSvgData } from '../../SvgManager/PropSvgData';
	import PropRotAngleManager from './PropRotAngleManager';

	/**
	 * Safe base64 encoding that works on all browsers including mobile
	 * Handles Unicode characters properly
	 */
	function safeBase64Encode(str: string): string {
		try {
			// First try the standard btoa
			return btoa(str);
		} catch (e) {
			// If that fails (likely due to Unicode characters), use this safer approach
			try {
				// Convert string to UTF-8 encoded binary string
				const binaryString = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
					String.fromCharCode(parseInt(p1, 16))
				);
				return btoa(binaryString);
			} catch (fallbackError) {
				console.error('Base64 encoding failed:', fallbackError);
				// Last resort fallback - use URI encoding which is more compatible
				return encodeURIComponent(str);
			}
		}
	}

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

	// Services
	const svgManager = new SvgManager();

	// Use the directly provided prop data as the base
	let effectivePropData = $state<PropData | undefined>(propData);

	// Compute rotation angle using derived (without side effects)
	const rotAngle = $derived.by(() => {
		// Ensure we have both loc and ori
		if (effectivePropData) {
			try {
				const rotAngleManager = new PropRotAngleManager({
					loc: effectivePropData.loc,
					ori: effectivePropData.ori
				});

				return rotAngleManager.getRotationAngle();
			} catch (error) {
				console.warn('Error calculating rotation angle:', error);
				return 0;
			}
		}
		return 0;
	});

	// Update the prop data with the rotation angle using an effect
	$effect(() => {
		if (propData && rotAngle !== undefined) {
			untrack(() => {
				propData.rotAngle = rotAngle;
			});
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

	// Track if we're currently in the process of loading
	let isLoading = $state(false);

	async function loadSvg() {
		try {
			// Safety check
			if (!effectivePropData || isLoading) {
				return;
			}

			// Mark that we're loading to prevent reactivity loops
			isLoading = true;

			// Create a consistent cache key
			const cacheKey = getPropCacheKey(effectivePropData.propType, effectivePropData.color);

			// First check the component-level cache
			if (propSvgCache.has(cacheKey)) {
				untrack(() => {
					svgData = propSvgCache.get(cacheKey)!;
					isLoaded = true;
					props.loaded?.({});
				});
				isLoading = false;
				return;
			}

			// Then check the resource cache via SvgManager
			// This will be populated if props were preloaded at app startup
			try {
				// Use a microtask to break potential reactivity chains
				await new Promise<void>((resolve) => {
					queueMicrotask(() => resolve());
				});

				const cachedSvg = await svgManager.getPropSvg(
					effectivePropData.propType,
					effectivePropData.color
				);

				if (cachedSvg) {
					const { viewBox, center } = parsePropSvg(cachedSvg, effectivePropData.color);

					untrack(() => {
						svgData = {
							imageSrc: `data:image/svg+xml;base64,${safeBase64Encode(cachedSvg)}`,
							viewBox,
							center
						};

						// Cache for future use
						propSvgCache.set(cacheKey, svgData);

						isLoaded = true;

						// Use a much longer timeout to completely break the reactivity chain
						// This is crucial for preventing infinite loops
						if (props.loaded) {
							setTimeout(() => {
								// Use a try-catch to prevent errors from propagating
								try {
									props.loaded?.({});
								} catch (error) {
									console.error('Error in Prop loaded callback:', error);
								}
							}, 200); // Use a longer timeout
						}
					});
					isLoading = false;
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
				imageSrc: `data:image/svg+xml;base64,${safeBase64Encode(svgText)}`,
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

			// Use a much longer timeout to completely break the reactivity chain
			// This is crucial for preventing infinite loops
			if (props.loaded) {
				setTimeout(() => {
					// Use a try-catch to prevent errors from propagating
					try {
						props.loaded?.({});
					} catch (error) {
						console.error('Error in Prop loaded callback:', error);
					}
				}, 200); // Use a longer timeout
			}
		} catch (error: any) {
			console.error('Error loading prop SVG:', error);

			// Create a better fallback SVG for error state
			const fallbackColor = effectivePropData?.color === 'red' ? '#ED1C24' : '#2E3192';
			const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
				<rect width="100" height="100" fill="#f8f8f8" />
				<circle cx="50" cy="50" r="30" fill="${fallbackColor}" opacity="0.3" />
				<circle id="centerPoint" cx="50" cy="50" r="2" fill="${fallbackColor}" />
			</svg>`;

			svgData = {
				imageSrc: `data:image/svg+xml;base64,${safeBase64Encode(fallbackSvg)}`,
				viewBox: { width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};

			clearTimeout(loadTimeout);
			isLoaded = true;

			// Use setTimeout to break the reactivity chain for callbacks
			setTimeout(() => {
				// Use untrack to prevent reactivity loops
				untrack(() => {
					props.loaded?.({ error: true });
					props.error?.({ message: (error as Error)?.message || 'Unknown error' });
				});
			}, 0);
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
