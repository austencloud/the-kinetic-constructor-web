<!-- src/lib/components/SequenceWorkbench/ShareRenderer.svelte -->
<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { browser } from '$app/environment';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import type { BeatData as ContainerBeatData } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import { BEAT_FRAME_CONTEXT_KEY, type ElementContext } from '../context/ElementContext';
	import type { BeatData as RendererBeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
	import type { PictographData } from '$lib/types/PictographData';
	import type { Letter } from '$lib/types/Letter';
	import type { TKAPosition } from '$lib/types/TKAPosition';
	import type { GridMode, VTGDir, VTGTiming } from '$lib/types/Types';
	import { logger } from '$lib/core/logging';
	import { imageExportSettings, type ImageExportSettings } from '$lib/state/image-export-settings';
	import { setupElementListeners } from './utils/ShareElementFinder';
	import { renderSequence as renderSequenceToImage } from './ShareSequenceRenderer';
	import type { SequenceRenderResult } from './imageExport/types';

	// Props using Svelte 5 runes
	const props = $props<{
		beatFrameElement: HTMLElement | null;
	}>();

	// Local state
	let cachedBeatFrameElement = $state<HTMLElement | null>(null);
	let sequenceName = $state('');
	let lastRenderResult: SequenceRenderResult | null = $state(null);
	let sequenceLoaded = $state(false);
	let sequenceBeatsCache: any[] = $state([]);
	let currentWord = $state('');

	// Set up element listeners
	const cleanupElementListeners = setupElementListeners();

	// Try to get the element from context
	const beatFrameContext = getContext<ElementContext>(BEAT_FRAME_CONTEXT_KEY);

	// Set up an effect to update our local reference from context if available
	$effect(() => {
		if (beatFrameContext) {
			const contextElement = beatFrameContext.getElement();
			if (contextElement) {
				console.log('ShareRenderer: Got element from context');
				cachedBeatFrameElement = contextElement;
			}
		}
	});

	// Log the beatFrameElement when it changes and cache it
	$effect(() => {
		console.log('ShareRenderer: beatFrameElement prop changed:', props.beatFrameElement);

		if (props.beatFrameElement) {
			cachedBeatFrameElement = props.beatFrameElement;
			console.log('ShareRenderer: Cached beatFrameElement from props');

			// Store in global fallback as well
			if (browser) {
				(window as any).__cachedBeatFrameElement = props.beatFrameElement;
			}
		} else if (browser && (window as any).__beatFrameElementRef) {
			// Try to get from global fallback
			cachedBeatFrameElement = (window as any).__beatFrameElementRef;
			console.log('ShareRenderer: Using global fallback for beatFrameElement');
		} else if (browser && (window as any).__cachedBeatFrameElement) {
			// Try to get from our own cached reference
			cachedBeatFrameElement = (window as any).__cachedBeatFrameElement;
			console.log('ShareRenderer: Using previously cached beatFrameElement');
		}
	});

	// Clean up on destroy
	onMount(() => {
		return () => {
			cleanupElementListeners();
		};
	});

	const sequence = useContainer(sequenceContainer);

	// Monitor sequence data availability
	$effect(() => {
		const currentBeats = sequence.beats;
		console.log('ShareRenderer: Sequence beats updated, count:', currentBeats?.length || 0);

		// Cache the sequence beats for reliability
		if (currentBeats && Array.isArray(currentBeats)) {
			sequenceBeatsCache = [...currentBeats];
			sequenceLoaded = currentBeats.length > 0;
			console.log('ShareRenderer: Sequence beats cached, loaded:', sequenceLoaded);
		} else {
			console.warn('ShareRenderer: Sequence beats not available or not an array');
			sequenceLoaded = false;
		}
	});

	// Generate sequence name when sequence changes
	$effect(() => {
		const currentSequenceBeats = sequence.beats;
		if (currentSequenceBeats && currentSequenceBeats.length > 0) {
			// Update sequence name based on the letters in the sequence
			const letters = currentSequenceBeats
				.map((beat) => ((beat.letter || beat.metadata?.letter) as string) || '')
				.filter((letter) => letter.trim() !== '')
				.join('');

			sequenceName = letters
				? `Sequence: ${letters}`
				: sequence.metadata?.name || 'Kinetic Sequence';

			currentWord = letters || 'Sequence';
		}
	});

	// Render the sequence
	async function renderSequence(
		options: {
			beatFrameElement?: any;
			contextElement?: HTMLElement | null;
			sequenceName?: string;
			currentWord?: string;
		} = {}
	): Promise<SequenceRenderResult | null> {
		console.log('ShareRenderer: renderSequence called');

		try {
			// Use cached sequence beats for reliability
			const currentSequenceBeats =
				sequenceBeatsCache.length > 0 ? sequenceBeatsCache : sequence.beats;

			if (!currentSequenceBeats || currentSequenceBeats.length === 0) {
				console.warn('ShareRenderer: No beats in the current sequence to export.');
				logger.warn('No beats in the current sequence to export.');
				throw new Error('No beats in sequence to export');
			}

			// Verify sequence data is valid
			const hasValidData = currentSequenceBeats.every(
				(beat) =>
					beat &&
					typeof beat === 'object' &&
					beat.id &&
					(beat.letter || (beat.metadata && beat.metadata.letter))
			);

			if (!hasValidData) {
				console.error('ShareRenderer: Sequence data is invalid or incomplete');
				logger.error('Sequence data is invalid or incomplete');
				throw new Error('Sequence data is invalid or incomplete');
			}

			// Use the imported utility function to render the sequence
			const result = await renderSequenceToImage({
				beatFrameElement: options.beatFrameElement || props.beatFrameElement,
				contextElement: options.contextElement || cachedBeatFrameElement,
				sequenceName: options.sequenceName || sequenceName,
				currentWord: options.currentWord || currentWord
			});

			if (result) {
				lastRenderResult = result;
			}

			return result;
		} catch (error) {
			console.error('ShareRenderer: Error rendering sequence:', error);
			logger.error('Error rendering sequence:', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			return null;
		}
	}

	// Export the renderSequence function and lastRenderResult
	export { renderSequence, lastRenderResult, sequenceName, currentWord };
</script>
