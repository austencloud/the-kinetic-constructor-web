<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer.svelte';

	import { BEAT_FRAME_CONTEXT_KEY, type ElementContext } from '../context/ElementContext';
	import { getContext } from 'svelte';
	import { showError } from '$lib/components/shared/ToastManager.svelte';
	import {
		findBeatFrameElement,
		listenForBeatFrameElement,
		renderSequence,
		shareSequence,
		downloadSequenceImage,
		isWebShareSupported
	} from './utils/ShareUtils';
	import ShareDropdown from './ShareDropdown.svelte';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let isDropdownOpen = $state(false);
	let isRendering = $state(false);
	let showSuccessIndicator = $state(false);
	let successTimeout: number | null = $state(null);

	const { beatFrameElement = null } = $props<{ beatFrameElement?: HTMLElement | null }>();
	let beatFrameElementState = $state<HTMLElement | null>(beatFrameElement);
	$effect(() => {
		if (beatFrameElement) {
			beatFrameElementState = beatFrameElement;
		}
	});

	const sequence = $state(sequenceContainer.state);
	const sequenceBeats = $derived(sequence.beats || []);
	const sequenceName = $derived(generateSequenceName(sequenceBeats));
	const beatFrameContext = getContext<ElementContext>(BEAT_FRAME_CONTEXT_KEY);
	$effect(() => {
		if (beatFrameContext) {
			const contextElement = beatFrameContext.getElement();
			if (contextElement) {
				beatFrameElementState = contextElement;
			}
		}
	});

	onMount(() => {
		if (!beatFrameElementState) {
			const element = findBeatFrameElement(beatFrameContext);
			if (element) {
				beatFrameElementState = element;
			}
		}

		const cleanupListener = listenForBeatFrameElement((element) => {
			beatFrameElementState = element;
		});

		return () => {
			cleanupListener();

			if (successTimeout !== null) {
				clearTimeout(successTimeout);
				successTimeout = null;
			}
		};
	});

	function generateSequenceName(beats: any[]): string {
		if (!beats || beats.length === 0) return 'Sequence';

		const letters = beats
			.map((beat) => ((beat.letter || beat.metadata?.letter) as string) || '')
			.filter((letter) => letter.trim() !== '')
			.join('');

		return letters || 'Sequence';
	}

	function toggleDropdown() {
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		isDropdownOpen = !isDropdownOpen;
	}

	function closeDropdown() {
		isDropdownOpen = false;
	}

	async function handleShare() {
		if (!browser) return;

		if (hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('success');
		}

		try {
			closeDropdown();

			if (!sequenceBeats || sequenceBeats.length === 0) {
				showError('No sequence to share');
				return;
			}

			if (!isWebShareSupported()) {
				showError("Your device doesn't support sharing");
				return;
			}

			isRendering = true;

			const result = await renderSequence({
				sequenceName,
				sequenceBeats,
				difficultyLevel: sequence.metadata?.difficulty || 1,
				beatFrameElement: beatFrameElementState
			});

			if (!result) {
				showError('Failed to generate image for sharing');
				isRendering = false;
				return;
			}

			await shareSequence({
				sequenceBeats,
				sequenceName,
				imageResult: result
			});

			showSuccessIndicator = true;

			if (successTimeout !== null) {
				clearTimeout(successTimeout);
			}

			successTimeout = window.setTimeout(() => {
				showSuccessIndicator = false;
				successTimeout = null;
			}, 2000);

			hapticFeedbackService.trigger('success');
		} catch (error) {
			showError('Failed to share sequence');
		} finally {
			isRendering = false;
		}
	}

	async function handleDownload() {
		if (!browser) return;

		if (hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('success');
		}

		try {
			closeDropdown();

			if (!sequenceBeats || sequenceBeats.length === 0) {
				showError('No sequence to download');
				return;
			}

			isRendering = true;

			if (!beatFrameElementState) {
				beatFrameElementState = findBeatFrameElement(beatFrameContext);

				if (!beatFrameElementState) {
					showError('Cannot find sequence display. Please try again.');
					isRendering = false;
					return;
				}
			}

			const result = await renderSequence({
				sequenceName,
				sequenceBeats,
				difficultyLevel: sequence.metadata?.difficulty || 1,
				beatFrameElement: beatFrameElementState
			});

			if (!result) {
				showError('Failed to generate image for download');
				isRendering = false;
				return;
			}

			const downloadResult = await downloadSequenceImage({
				sequenceName,
				imageResult: result
			});

			if (downloadResult) {
				if (hapticFeedbackService.isAvailable()) {
					hapticFeedbackService.trigger('success');
				}

				showSuccessIndicator = true;

				if (successTimeout !== null) {
					clearTimeout(successTimeout);
				}

				successTimeout = window.setTimeout(() => {
					showSuccessIndicator = false;
					successTimeout = null;
				}, 2000);
			}
		} catch (error) {
			const isCancellation =
				error instanceof Error &&
				(error.message === 'USER_CANCELLED_OPERATION' ||
					error.message.includes('cancelled') ||
					error.message.includes('canceled') ||
					error.message.includes('aborted') ||
					error.name === 'AbortError');

			if (!isCancellation) {
				showError('Failed to download sequence');
			}
		} finally {
			isRendering = false;
		}
	}
</script>

<button
	class="share-button"
	onclick={toggleDropdown}
	aria-label="Share sequence"
	class:loading={isRendering}
	class:success={showSuccessIndicator}
>
	<div class="icon-wrapper">
		{#if isRendering}
			<i class="fa-solid fa-spinner fa-spin"></i>
		{:else if showSuccessIndicator}
			<i class="fa-solid fa-check" transition:scale={{ duration: 300, easing: quintOut }}></i>
		{:else}
			<i class="fa-solid fa-share-alt"></i>
		{/if}
	</div>

	{#if showSuccessIndicator}
		<div class="success-pulse" transition:fade={{ duration: 300 }}></div>
	{/if}
</button>

{#if isDropdownOpen}
	<div class="dropdown-container">
		<ShareDropdown onShare={handleShare} onDownload={handleDownload} onClose={closeDropdown} />
	</div>
{/if}

<style>
	:global(.sequence-widget > .main-layout > .share-button) {
		position: absolute !important;
		top: calc(var(--button-size-factor, 1) * 10px) !important;
		right: calc(var(--button-size-factor, 1) * 10px) !important;
		width: calc(var(--button-size-factor, 1) * 45px) !important;
		height: calc(var(--button-size-factor, 1) * 45px) !important;
		z-index: 40 !important;
		margin: 0 !important;
		display: flex !important;
		visibility: visible !important;
		opacity: 1 !important;
	}

	:global(.sequence-widget > .main-layout > .share-button i) {
		font-size: calc(var(--button-size-factor, 1) * 19px);
	}

	:global(.sequence-widget > .main-layout > .dropdown-container) {
		position: absolute !important;
		top: calc(
			var(--button-size-factor, 1) * 10px + var(--button-size-factor, 1) * 45px + 5px
		) !important;
		right: calc(var(--button-size-factor, 1) * 10px) !important;
		z-index: 41 !important;
	}

	.share-button {
		background-color: var(--tkc-button-panel-background, #2a2a2e);
		color: var(--tkc-icon-color-share, #00bcd4);
		border: none;
		border-radius: 50%;
		width: 100%;
		height: 100%;
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
		padding: 0;
		pointer-events: auto;
		position: relative;
		overflow: hidden;
	}

	.share-button.success {
		color: #4caf50;
		animation: success-pulse 0.5s ease-out;
	}

	@keyframes success-pulse {
		0% {
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
		}
		50% {
			transform: scale(1.1);
			box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
		}
		100% {
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
		}
	}

	.success-pulse {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0) 70%);
		pointer-events: none;
		z-index: -1;
	}

	.share-button:hover {
		background-color: var(--tkc-button-panel-background-hover, #3c3c41);
		transform: translateY(-2px) scale(1.05);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.26);
		color: var(--tkc-icon-color-share-hover, #6c9ce9);
	}

	.share-button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--tkc-focus-ring-color, rgba(108, 156, 233, 0.6));
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
		width: 100%;
		height: 100%;
		color: inherit;
	}

	.icon-wrapper i {
		line-height: 1;
		display: block;
		transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.share-button:hover .icon-wrapper i {
		transform: scale(1.1);
	}

	.dropdown-container {
		position: absolute;
		z-index: 41;
	}
</style>
