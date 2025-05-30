<!-- src/lib/components/objects/Glyphs/TKAGlyph/TKAGlyph.svelte -->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { parseTurnsTupleString } from './utils/parseTurnsTuple';
	import { glyphContainer, type Rect } from '$lib/stores/glyphContainer.svelte';
	import type { Letter } from '$lib/types/Letter';
	import type { TKATurns } from '$lib/types/Types';
	import LetterRenderer from './components/LetterRenderer.svelte';
	import DashRenderer from './components/DashRenderer.svelte';
	import DotsRenderer from './components/DotsRenderer.svelte';
	import TurnsRenderer from './components/TurnsRenderer.svelte';

	// Props using Svelte 5 runes
	const {
		letter = null,
		turnsTuple = '',
		x = 0,
		y = 0,
		scale = 1,
		onloaded,
		onloading
	} = $props<{
		letter?: Letter | null;
		turnsTuple?: string;
		x?: number;
		y?: number;
		scale?: number;
		onloaded?: (success: boolean) => void;
		onloading?: () => void;
	}>();

	// Local state using Svelte 5 runes with reactive loop prevention
	let letterRect = $state<Rect | null>(null);
	let letterLoaded = $state(false);

	// CRITICAL FIX: Prevent infinite reactive loops in glyph rendering
	let isProcessingLetter = false;

	// Parse the turnsTuple using $derived
	const parsedTurns = $derived(parseTurnsTuple(turnsTuple));
	const direction = $derived(parsedTurns?.direction || null);
	const topTurn = $derived(parsedTurns?.top || (0 as TKATurns));
	const bottomTurn = $derived(parsedTurns?.bottom || (0 as TKATurns));
	const hasTurns = $derived(
		(topTurn !== 'fl' && Number(topTurn) > 0) || (bottomTurn !== 'fl' && Number(bottomTurn) > 0)
	);
	const shouldShowDots = $derived(hasTurns);

	// Ensure common assets are loaded if needed
	onMount(() => {
		// Only trigger preloading if dash and dot aren't loaded yet
		if (!glyphContainer.cache.dotSVG || !glyphContainer.cache.dashSVG) {
			// Only preload if not already in progress
			if (!glyphContainer.loading.isPreloading && !glyphContainer.loading.preloadCompleted) {
				glyphContainer.preloadCommonAssets();
			}
		}
	});

	// Helper functions
	function parseTurnsTuple(tuple: string) {
		if (!tuple) return { direction: null, top: 0 as TKATurns, bottom: 0 as TKATurns };

		const [dir, top, bottom] = parseTurnsTupleString(tuple);
		return { direction: dir, top, bottom };
	}

	// Handle letter loading events
	function handleLetterLoaded(rect: Rect) {
		// CRITICAL FIX: Prevent infinite reactive loops
		if (isProcessingLetter) {
			return;
		}
		isProcessingLetter = true;

		// Use untrack to prevent reactive loops
		untrack(() => {
			letterRect = rect;
			letterLoaded = true;
		});

		onloaded?.(true);

		// Reset processing flag after a delay
		setTimeout(() => {
			isProcessingLetter = false;
		}, 100);
	}

	function handleLoadingStarted() {
		onloading?.();
	}

	function handleLoadingComplete(success: boolean) {
		if (success) {
			// Loading completed successfully, but we still need the letterRect
			// The letterLoaded flag will be set when the image is fully rendered
		} else {
			// Loading failed
			onloaded?.(false);
		}
	}
</script>

{#if letter && letter !== undefined}
	<g class="tka-glyph" transform={`translate(${x}, ${y}) scale(${scale})`}>
		<LetterRenderer
			{letter}
			onletterLoaded={handleLetterLoaded}
			onloadingStarted={handleLoadingStarted}
			onloadingComplete={handleLoadingComplete}
		/>

		{#if letterLoaded && letterRect}
			<DashRenderer {letter} {letterRect} />

			<DotsRenderer {direction} {letterRect} {letter} {shouldShowDots} />

			<TurnsRenderer topValue={topTurn} bottomValue={bottomTurn} {letterRect} />
		{/if}
	</g>
{/if}
