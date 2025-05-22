<!-- src/lib/components/objects/Glyphs/TKAGlyph/TKAGlyph.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { parseTurnsTupleString } from './utils/parseTurnsTuple';
	import { glyphContainer, type Rect } from '$lib/stores/glyphContainer.svelte';
	import type { Letter } from '$lib/types/Letter';
	import type { DirRelation, PropRotDir, TKATurns } from '$lib/types/Types';
	import LetterRenderer from './components/LetterRenderer.svelte';
	import DashRenderer from './components/DashRenderer.svelte';
	import DotsRenderer from './components/DotsRenderer.svelte';
	import TurnsRenderer from './components/TurnsRenderer.svelte';

	// Props
	export let letter: Letter | null = null;
	export let turnsTuple: string = '';
	export let x: number = 0;
	export let y: number = 0;
	export let scale: number = 1;

	// Local state
	let letterRect: Rect | null = null;
	let letterLoaded = false;
	let isLoading = false;

	// Parse the turnsTuple
	$: parsedTurns = parseTurnsTuple(turnsTuple);
	$: direction = parsedTurns?.direction || null;
	$: topTurn = parsedTurns?.top || (0 as TKATurns);
	$: bottomTurn = parsedTurns?.bottom || (0 as TKATurns);
	$: hasTurns =
		(topTurn !== 'fl' && Number(topTurn) > 0) || (bottomTurn !== 'fl' && Number(bottomTurn) > 0);
	$: shouldShowDots = hasTurns;

	// Ensure common assets are loaded if needed
	onMount(() => {
		// Only trigger preloading if dash and dot aren't loaded yet
		if (!glyphContainer.cache.dotSVG || !glyphContainer.cache.dashSVG) {
			// Only preload if not already in progress
			if (!glyphContainer.loading.isPreloading && !glyphContainer.loading.preloadCompleted) {
				console.log('TKAGlyph: Triggering preload of common assets');
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

	// Create event dispatcher
	const dispatch = createEventDispatcher<{
		loaded: boolean;
		loading: void;
	}>();

	// Handle letter loading events
	function handleLetterLoaded(event: CustomEvent<Rect>) {
		letterRect = event.detail;
		letterLoaded = true;
		dispatch('loaded', true);
	}

	function handleLoadingStarted() {
		isLoading = true;
		dispatch('loading');
	}

	function handleLoadingComplete(event: CustomEvent<boolean>) {
		isLoading = false;
		if (event.detail) {
			// Loading completed successfully, but we still need the letterRect
			// The letterLoaded flag will be set when the image is fully rendered
		} else {
			// Loading failed
			dispatch('loaded', false);
		}
	}
</script>

<g class="tka-glyph" transform={`translate(${x}, ${y}) scale(${scale})`}>
	<LetterRenderer
		{letter}
		on:letterLoaded={handleLetterLoaded}
		on:loadingStarted={handleLoadingStarted}
		on:loadingComplete={handleLoadingComplete}
	/>

	{#if letterLoaded && letterRect}
		<DashRenderer {letter} {letterRect} />

		<DotsRenderer {direction} {letterRect} {letter} {shouldShowDots} />

		<TurnsRenderer topValue={topTurn} bottomValue={bottomTurn} {letterRect} />
	{/if}
</g>
