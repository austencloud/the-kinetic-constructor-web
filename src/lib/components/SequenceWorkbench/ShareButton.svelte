<!-- src/lib/components/SequenceWorkbench/ShareButton.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import type { BeatData as ContainerBeatData } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import { renderSequenceToImage, downloadDataUrl } from '$lib/utils/sequenceImageRenderer';
	import type { SequenceRenderOptions } from '$lib/utils/sequenceImageRenderer';
	import type { BeatData as RendererBeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
	import type { PictographData } from '$lib/types/PictographData';
	import type { Letter } from '$lib/types/Letter';
	import type { TKAPosition } from '$lib/types/TKAPosition';
	import type { GridMode, VTGDir, VTGTiming } from '$lib/types/Types';

	// Props using Svelte 5 runes
	const props = $props<{
		beatFrameElement: HTMLElement | null;
		onShare?: () => void; // Optional callback
	}>();

	const sequence = useContainer(sequenceContainer);

	async function handleClick() {
		if (props.onShare) {
			props.onShare();
		}

		const currentSequenceBeats = sequence.beats;
		const sequenceName = sequence.metadata?.name || 'sequence';

		if (!props.beatFrameElement) {
			console.error('BeatFrame element not available for image export.');
			return;
		}

		if (!currentSequenceBeats || currentSequenceBeats.length === 0) {
			console.warn('No beats in the current sequence to export.');
			return;
		}

		const beatsToRender: RendererBeatData[] = currentSequenceBeats.map(
			(beat: ContainerBeatData) => {
				const pictographData: PictographData = {
					letter: ((beat.letter || beat.metadata?.letter) as Letter) || null,
					startPos: ((beat.position || beat.metadata?.startPos) as TKAPosition) || null,
					endPos: (beat.metadata?.endPos as TKAPosition) || null,
					gridMode: (beat.metadata?.gridMode as GridMode) || 'diamond',
					redPropData: beat.redPropData || null,
					bluePropData: beat.bluePropData || null,
					redMotionData: beat.redMotionData || null,
					blueMotionData: beat.blueMotionData || null,
					redArrowData: beat.redArrowData || null,
					blueArrowData: beat.blueArrowData || null,
					grid: (beat.metadata?.grid as string) || '',
					timing: (beat.metadata?.timing as VTGTiming) || null,
					direction: (beat.metadata?.direction as VTGDir) || null,
					gridData: null // Explicitly set gridData, assuming it's not directly in beat.metadata or needs specific construction
				};

				return {
					id: beat.id,
					beatNumber: beat.number,
					filled: true,
					pictographData: pictographData,
					duration: 1,
					metadata: {
						blueReversal: (beat.metadata?.blueReversal as boolean) || undefined,
						redReversal: (beat.metadata?.redReversal as boolean) || undefined,
						tags: (beat.metadata?.tags as string[]) || undefined
					}
				};
			}
		);

		const renderCols = 4;
		const renderRows = Math.ceil(beatsToRender.length / renderCols);

		const options: SequenceRenderOptions = {
			beats: beatsToRender,
			startPosition: null,
			rows: renderRows,
			cols: renderCols,
			padding: 10,
			backgroundColor: '#2a2a2e',
			includeTitle: true,
			title: sequenceName,
			format: 'png',
			quality: 0.92
		};

		try {
			const imageToRenderElement =
				(props.beatFrameElement?.querySelector('.beat-frame') as HTMLElement) ||
				props.beatFrameElement;
			const result = await renderSequenceToImage(imageToRenderElement, options);
			downloadDataUrl(result.dataUrl, `${sequenceName}.png`);
		} catch (error) {
			console.error('Error exporting sequence to image:', error);
		}
	}
</script>

<button
	class="share-button ripple"
	onclick={handleClick}
	aria-label="Share sequence"
	data-mdb-ripple="true"
	data-mdb-ripple-color="light"
	in:fly={{ x: 20, duration: 300, delay: 200 }}
>
	<div class="icon-wrapper">
		<i class="fa-solid fa-share-alt"></i>
	</div>
</button>

<style>
	.share-button {
		/* Base sizes for dynamic scaling */
		--base-size: 45px; /* Base size of the button (was 56px) */
		--base-icon-size: 19px; /* Base size of the icon (was 24px) */
		--base-margin: 10px; /* Base margin from corner */

		position: absolute;
		top: calc(var(--button-size-factor, 1) * var(--base-margin)); /* Dynamic top margin */
		right: calc(var(--button-size-factor, 1) * var(--base-margin)); /* Dynamic right margin */
		width: calc(var(--button-size-factor, 1) * var(--base-size)); /* Dynamic width */
		height: calc(var(--button-size-factor, 1) * var(--base-size)); /* Dynamic height */
		min-width: 38px; /* Minimum width (was 48px) */
		min-height: 38px; /* Minimum height (was 48px) */

		background-color: var(
			--tkc-button-panel-background,
			#2a2a2e
		); /* Dark background, consistent with Clear button */
		color: var(--tkc-icon-color-share, #00bcd4); /* Teal icon color, or a theme variable */

		border-radius: 50%; /* Perfectly round */
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			transform 0.2s ease-out,
			background-color 0.2s ease-out,
			box-shadow 0.2s ease-out;
		z-index: 40; /* Consistent with other FABs */
		box-shadow:
			0 3px 6px rgba(0, 0, 0, 0.16),
			0 3px 6px rgba(0, 0, 0, 0.23);
		border: none;
		padding: 0;
		pointer-events: auto;
	}

	.share-button:hover {
		background-color: var(--tkc-button-panel-background-hover, #3c3c41);
		transform: translateY(-2px) scale(1.05);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.26);
	}

	.share-button:active {
		transform: translateY(0px) scale(1);
		background-color: var(--tkc-button-panel-background-active, #1e1e21);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 1px 2px rgba(0, 0, 0, 0.24);
	}

	.icon-wrapper {
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		width: auto;
		height: auto;
		color: inherit; /* Inherits color from .share-button */
	}

	.icon-wrapper i.fa-share-alt {
		font-size: calc(var(--button-size-factor, 1) * var(--base-icon-size)); /* Dynamic icon size */
	}
</style>
