<!-- src/lib/components/objects/Arrow/Arrow.svelte -->
<!-- FIXED: Eliminated reactive loops and simplified state management -->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { ArrowData } from './ArrowData';
	import type { ArrowSvgData } from '../../SvgManager/ArrowSvgData';
	import { ArrowSvgLoader } from './services/ArrowSvgLoader';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { Motion } from '../Motion/Motion';
	import ArrowRotAngleManager from './ArrowRotAngleManager';
	import ArrowSvgMirrorManager from './ArrowSvgMirrorManager';
	import type { PictographService } from '$lib/components/Pictograph/PictographService';
	import type { PictographData } from '$lib/types/PictographData';
	import { svgPreloadingService } from '$lib/services/SvgPreloadingService.svelte';

	// Props
	const props = $props<{
		arrowData?: ArrowData;
		beatId?: string;
		color?: 'red' | 'blue';
		motion?: Motion | null;
		pictographData?: PictographData | null;
		pictographService?: PictographService | null;
		loadTimeoutMs?: number;
		animationDuration?: number;
		loaded?: (event: { timeout?: boolean; error?: boolean }) => void;
		error?: (event: { message: string; component: string; color: string }) => void;
		imageLoaded?: () => void;
	}>();

	// CRITICAL FIX: Simplified state management - single state object with minimal reactivity
	let componentState = $state({
		svgData: null as ArrowSvgData | null,
		transform: '',
		isReady: false // Single flag instead of multiple reactive booleans
	});

	// CRITICAL FIX: Initialize everything in constructor, not reactively
	const effectiveArrowData = props.arrowData;
	let rotationAngle = 0;
	let svgManager: SvgManager;
	let svgLoader: ArrowSvgLoader;
	let mirrorManager: ArrowSvgMirrorManager | null = null;
	let rotAngleManager: ArrowRotAngleManager | null = null;

	// Initialize services immediately - no reactive dependencies
	if (effectiveArrowData) {
		svgManager = new SvgManager();
		svgLoader = new ArrowSvgLoader(svgManager);
		mirrorManager = new ArrowSvgMirrorManager(effectiveArrowData);

		if (props.pictographData) {
			rotAngleManager = new ArrowRotAngleManager(
				props.pictographData,
				props.pictographService || undefined
			);
		}

		// Calculate everything upfront
		rotationAngle = getRotationAngle();

		if (effectiveArrowData.coords) {
			const mirrorTransform = effectiveArrowData.svgMirrored ? 'scale(-1, 1)' : '';
			componentState.transform = `
				translate(${effectiveArrowData.coords.x}, ${effectiveArrowData.coords.y})
				rotate(${rotationAngle})
				${mirrorTransform}
			`.trim();
		}
	}

	// Simple cache - no complex reactive management
	const svgDataCache = new Map<string, ArrowSvgData>();

	function getRotationAngle(): number {
		if (props.motion && rotAngleManager && effectiveArrowData) {
			return rotAngleManager.calculateRotationAngle(
				props.motion,
				effectiveArrowData.loc,
				effectiveArrowData.svgMirrored
			);
		}
		return effectiveArrowData?.rotAngle || 0;
	}

	// CRITICAL FIX: Simplified loading without cascading timeouts
	async function loadArrowSvg() {
		if (!effectiveArrowData || componentState.isReady) return;

		try {
			const cacheKey = `arrow-${effectiveArrowData.motionType}-${effectiveArrowData.startOri}-${effectiveArrowData.turns}-${effectiveArrowData.color}-${effectiveArrowData.svgMirrored}`;

			let svgData = svgDataCache.get(cacheKey);

			if (!svgData) {
				// Update mirror state before loading
				mirrorManager?.updateMirror();

				const result = await svgLoader.loadSvg(
					effectiveArrowData.motionType,
					effectiveArrowData.startOri,
					effectiveArrowData.turns,
					effectiveArrowData.color,
					effectiveArrowData.svgMirrored
				);

				svgData = result.svgData;
				svgDataCache.set(cacheKey, svgData);
			}

			// CRITICAL FIX: Single state update, no cascading reactions
			untrack(() => {
				componentState.svgData = svgData;
				componentState.isReady = true;
			});

			// CRITICAL FIX: Simplified callback - no setTimeout chains
			notifyLoaded();
		} catch (error) {
			handleLoadError(error);
		}
	}

	function handleLoadError(error: unknown) {
		console.error('Arrow load error:', error);

		untrack(() => {
			componentState.svgData = svgLoader.getFallbackSvgData();
			componentState.isReady = true;
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
				console.error('Error in Arrow loaded callback:', error);
			}
		});
	}

	// 🚨 NUCLEAR FIX: Prevent infinite loops with mounting guard
	let isMounted = $state(false);
	let hasInitialized = $state(false);

	// CRITICAL FIX: Simple onMount - no reactive dependencies or complex timing
	onMount(() => {
		// 🚨 NUCLEAR FIX: Prevent multiple initializations
		if (hasInitialized) {
			return;
		}
		hasInitialized = true;
		isMounted = true;

		if (effectiveArrowData?.motionType) {
			// CRITICAL FIX: Check preloading status once, then load immediately or with minimal delay
			const isPreloaded = svgPreloadingService.areArrowsReady();

			if (isPreloaded) {
				// 🚨 NUCLEAR FIX: Use queueMicrotask instead of setTimeout to avoid reactive loops
				queueMicrotask(() => {
					if (isMounted && !componentState.isReady) {
						loadArrowSvg();
					}
				});
			} else {
				// 🚨 NUCLEAR FIX: Use queueMicrotask with a flag check instead of setTimeout
				queueMicrotask(() => {
					if (isMounted && !componentState.isReady) {
						loadArrowSvg();
					}
				});
			}
		} else {
			// No arrow data - mark as ready immediately
			componentState.isReady = true;
			notifyLoaded();
		}

		return () => {
			isMounted = false;
		};
	});
</script>

<!-- CRITICAL FIX: Simplified template with minimal conditional logic -->
{#if componentState.svgData && componentState.isReady && effectiveArrowData}
	<g
		transform={componentState.transform}
		data-testid="arrow-{effectiveArrowData.color}"
		data-motion-type={effectiveArrowData.motionType}
		data-mirrored={effectiveArrowData.svgMirrored ? 'true' : 'false'}
		data-loc={effectiveArrowData.loc}
		data-rot-angle={rotationAngle}
	>
		<image
			href={componentState.svgData.imageSrc}
			width={componentState.svgData.viewBox.width}
			height={componentState.svgData.viewBox.height}
			x={-componentState.svgData.center.x}
			y={-componentState.svgData.center.y}
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
