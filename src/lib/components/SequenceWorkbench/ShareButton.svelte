<!-- src/lib/components/SequenceWorkbench/ShareButton.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import type { BeatData as ContainerBeatData } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import { renderSequenceToImage, downloadDataUrl } from '$lib/utils/sequenceImageRenderer';
	import type { SequenceRenderOptions, SequenceRenderResult } from '$lib/utils/sequenceImageRenderer';
	import type { BeatData as RendererBeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
	import type { PictographData } from '$lib/types/PictographData';
	import type { Letter } from '$lib/types/Letter';
	import type { TKAPosition } from '$lib/types/TKAPosition';
	import type { GridMode, VTGDir, VTGTiming } from '$lib/types/Types';
	import {
		isWebShareSupported,
		generateShareableUrl,
		shareSequence,
		shareSequenceWithImage,
		isFileShareSupported,
		type ShareData
	} from '$lib/utils/shareUtils';
	import ShareDropdown from './ShareDropdown.svelte';
	import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
	import { logger } from '$lib/core/logging';

	// Props using Svelte 5 runes
	const props = $props<{
		beatFrameElement: HTMLElement | null;
		onShare?: () => void; // Optional callback
	}>();

	const sequence = useContainer(sequenceContainer);

	// Local state
	let isDropdownOpen = $state(false);
	let shareUrl = $state('');
	let isSharing = $state(false);
	let sequenceName = $state('');
	let lastRenderResult: SequenceRenderResult | null = $state(null);

	// Generate share URL when component mounts or sequence changes
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

			// Generate shareable URL
			shareUrl = generateShareableUrl(currentSequenceBeats, sequenceName);
		}
	});

	// Handle share button click
	async function handleClick() {
		// Call the original onShare callback if provided
		if (props.onShare) {
			props.onShare();
		}

		if (isSharing) return;

		try {
			isSharing = true;

			const currentSequenceBeats = sequence.beats;

			// Check if there are beats to share
			if (!currentSequenceBeats || currentSequenceBeats.length === 0) {
				showError('No sequence to share');
				return;
			}

			// Check if Web Share API is supported
			if (isWebShareSupported()) {
				// Prepare share data
				const shareData: ShareData = {
					title: 'Kinetic Constructor Sequence',
					text: `Check out this sequence: ${sequenceName}`,
					url: shareUrl
				};

				// Share using Web Share API
				await shareSequence(shareData);
			} else {
				// Show dropdown for desktop fallback
				isDropdownOpen = !isDropdownOpen;
			}
		} catch (error) {
			logger.error('Error sharing sequence', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			showError('Failed to share sequence');
		} finally {
			isSharing = false;
		}
	}

	// Close dropdown
	function closeDropdown() {
		isDropdownOpen = false;
	}

	// Render the sequence to an image
	async function renderSequence(): Promise<SequenceRenderResult | null> {
		if (!props.beatFrameElement) {
			logger.error('BeatFrame element not available for image export.');
			showError('Could not export image: Beat frame not found');
			return null;
		}

		const currentSequenceBeats = sequence.beats;
		if (!currentSequenceBeats || currentSequenceBeats.length === 0) {
			logger.warn('No beats in the current sequence to export.');
			showError('No sequence to export');
			return null;
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

			if (!imageToRenderElement) {
				throw new Error('Could not find element to render');
			}

			return await renderSequenceToImage(imageToRenderElement, options);
		} catch (error) {
			logger.error('Error rendering sequence to image:', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			showError('Failed to render sequence as image');
			return null;
		}
	}

	// Export sequence as image
	async function exportSequenceAsImage() {
		const result = await renderSequence();
		if (result) {
			lastRenderResult = result;
			downloadDataUrl(result.dataUrl, `${sequenceName}.png`);
			showSuccess('Image downloaded successfully');

			// Close dropdown after download
			if (isDropdownOpen) {
				closeDropdown();
			}
		}
	}

	// Share sequence with image
	async function shareSequenceWithImageHandler() {
		if (isSharing) return;

		try {
			isSharing = true;

			// Check if we already have a render result
			let result = lastRenderResult;
			if (!result) {
				// Render the sequence if we don't have a result
				result = await renderSequence();
				if (result) {
					lastRenderResult = result;
				} else {
					return;
				}
			}

			// Share the sequence with the image
			await shareSequenceWithImage(result, sequenceName, shareUrl);

			// Close dropdown after sharing
			if (isDropdownOpen) {
				closeDropdown();
			}
		} catch (error) {
			logger.error('Error sharing sequence with image', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			showError('Failed to share sequence with image');
		} finally {
			isSharing = false;
		}
	}
</script>

<div class="share-button-container">
	<button
		class="share-button ripple"
		onclick={handleClick}
		aria-label="Share sequence"
		data-mdb-ripple="true"
		data-mdb-ripple-color="light"
		in:fly={{ x: 20, duration: 300, delay: 200 }}
		class:sharing={isSharing}
		class:active={isDropdownOpen}
	>
		<div class="icon-wrapper">
			<i
				class="fa-solid {isSharing
					? 'fa-spinner fa-spin'
					: isWebShareSupported()
						? 'fa-share-alt'
						: 'fa-share-nodes'}"
			></i>
		</div>
	</button>

	{#if isDropdownOpen}
		<ShareDropdown
			url={shareUrl}
			{sequenceName}
			onDownloadImage={exportSequenceAsImage}
			onShareWithImage={shareSequenceWithImageHandler}
			onClose={closeDropdown}
		/>
	{/if}
</div>

<style>
	.share-button-container {
		position: absolute;
		top: var(--button-top-position, 10px);
		right: var(--button-right-position, 10px);
		z-index: 40;
	}

	.share-button {
		/* Base sizes for dynamic scaling */
		--base-size: 45px; /* Base size of the button (was 56px) */
		--base-icon-size: 19px; /* Base size of the icon (was 24px) */
		--base-margin: 10px; /* Base margin from corner */

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
			box-shadow 0.2s ease-out,
			color 0.2s ease-out;
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

	.share-button.active {
		background-color: var(--tkc-button-active-background, #00bcd4);
		color: var(--tkc-button-active-color, #ffffff);
		transform: scale(1.05);
		box-shadow: 0 0 12px rgba(0, 188, 212, 0.4);
	}

	.share-button.sharing {
		pointer-events: none;
		opacity: 0.8;
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

	.icon-wrapper i {
		font-size: calc(var(--button-size-factor, 1) * var(--base-icon-size)); /* Dynamic icon size */
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.share-button {
			--button-size-factor: 0.9;
		}
	}

	@media (max-width: 480px) {
		.share-button {
			--button-size-factor: 0.8;
		}
	}
</style>