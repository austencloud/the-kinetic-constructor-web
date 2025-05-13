<!--
  ShareButton Component

  This component provides a button for sharing and downloading sequence images.
  It uses the enhanced image exporter for reliable rendering.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import { BEAT_FRAME_CONTEXT_KEY, type ElementContext } from '../context/ElementContext';
	import { getContext } from 'svelte';
	import { logger } from '$lib/core/logging';
	import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
	import { isWebShareSupported, generateShareableUrl } from './utils/ShareUtils';
	import { imageExportSettings } from '$lib/state/image-export-settings';
	import { exportEnhancedImage } from '$lib/components/Pictograph/export/enhancedImageExporter';
	import { downloadImage } from '$lib/components/Pictograph/export/downloadUtils';
	import ShareDropdown from './ShareDropdown.svelte';

	// Track dropdown state
	let isDropdownOpen = $state(false);

	// Track rendering state
	let isRendering = $state(false);
	let lastResult: any = $state(null);

	// Track element references
	let beatFrameElement: HTMLElement | null = $state(null);

	// Use the sequence container
	const sequence = useContainer(sequenceContainer);

	// Get the current sequence data
	const sequenceBeats = $derived(sequence.beats || []);
	const sequenceName = $derived(generateSequenceName(sequenceBeats));

	// Try to get the element from context
	const beatFrameContext = getContext<ElementContext>(BEAT_FRAME_CONTEXT_KEY);

	// Set up an effect to update our local reference from context if available
	$effect(() => {
		if (beatFrameContext) {
			const contextElement = beatFrameContext.getElement();
			if (contextElement) {
				console.log('ShareButton: Got element from context');
				beatFrameElement = contextElement;
			}
		}
	});

	// Set up event listener for beatframe-element-available
	onMount(() => {
		const handleElementAvailable = (event: CustomEvent) => {
			if (event.detail?.element) {
				console.log('ShareButton: Got element from event');
				beatFrameElement = event.detail.element;
			}
		};

		document.addEventListener(
			'beatframe-element-available',
			handleElementAvailable as EventListener
		);

		return () => {
			document.removeEventListener(
				'beatframe-element-available',
				handleElementAvailable as EventListener
			);
		};
	});

	// Generate a sequence name from the beats
	function generateSequenceName(beats: any[]): string {
		if (!beats || beats.length === 0) return 'Sequence';

		// Extract letters from beats
		const letters = beats
			.map((beat) => ((beat.letter || beat.metadata?.letter) as string) || '')
			.filter((letter) => letter.trim() !== '')
			.join('');

		return letters || 'Sequence';
	}

	// Toggle dropdown
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	// Close dropdown
	function closeDropdown() {
		isDropdownOpen = false;
	}

	// Handle share button click
	async function handleShare() {
		if (!browser) return;

		try {
			// Close dropdown
			closeDropdown();

			// Check if sequence is empty
			if (!sequenceBeats || sequenceBeats.length === 0) {
				showError('No sequence to share');
				return;
			}

			// Check if Web Share API is supported
			if (!isWebShareSupported()) {
				showError("Your device doesn't support sharing");
				return;
			}

			// Set rendering state
			isRendering = true;

			// Render the sequence
			const result = await renderSequence();

			if (!result) {
				showError('Failed to generate image for sharing');
				isRendering = false;
				return;
			}

			// Generate shareable URL
			const shareUrl = generateShareableUrl(sequenceBeats, sequenceName);

			// Create share data
			const shareData: any = {
				title: 'Kinetic Constructor Sequence',
				text: `Check out this sequence: ${sequenceName}\n\nOpen this link to reconstruct: ${shareUrl}`,
				url: shareUrl
			};

			// Try to share with image if supported
			try {
				// Convert data URL to blob
				const blob = dataURLtoBlob(result.dataUrl);

				// Create file from blob
				const file = new File([blob], `${sequenceName}.png`, { type: 'image/png' });

				// Add file to share data
				shareData.files = [file];

				// Check if device can share with files
				if (navigator.canShare && navigator.canShare(shareData)) {
					await navigator.share(shareData);
					showSuccess('Sequence shared successfully');
					return;
				}
			} catch (error) {
				console.warn('Failed to share with image, falling back to text-only share', error);
			}

			// Fall back to text-only share
			try {
				// Remove files property
				delete shareData.files;

				// Share without image
				await navigator.share(shareData);
				showSuccess('Sequence shared successfully');
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					console.log('User cancelled sharing');
				} else {
					showError('Failed to share sequence');
					console.error('Share error:', error);
				}
			}
		} catch (error) {
			showError('Failed to share sequence');
			console.error('Share error:', error);
		} finally {
			isRendering = false;
		}
	}

	// Handle download button click
	async function handleDownload() {
		if (!browser) return;

		try {
			// Close dropdown
			closeDropdown();

			// Check if sequence is empty
			if (!sequenceBeats || sequenceBeats.length === 0) {
				showError('No sequence to download');
				return;
			}

			// Set rendering state
			isRendering = true;

			// Render the sequence
			const result = await renderSequence();

			if (!result) {
				showError('Failed to generate image for download');
				isRendering = false;
				return;
			}

			// Generate filename
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
			const filename = `kinetic-sequence-${sequenceName.replace(/[^a-z0-9]/gi, '-').toLowerCase() || timestamp}.png`;

			// Download the image
			await downloadImage({
				dataUrl: result.dataUrl,
				filename
			});

			showSuccess('Image download started');
		} catch (error) {
			showError('Failed to download sequence');
			console.error('Download error:', error);
		} finally {
			isRendering = false;
		}
	}

	// Render the sequence
	async function renderSequence(): Promise<any> {
		if (!browser || !beatFrameElement) {
			console.error('Cannot render: not in browser environment or no beat frame element');
			return null;
		}

		try {
			// Get export settings
			let settings: any = {};
			const unsubscribe = imageExportSettings.subscribe((value) => {
				settings = value;
			});
			unsubscribe();

			// Find the start position beat
			let startPosition = null;
			for (const beat of sequenceBeats) {
				if (beat.metadata?.isStartPosition) {
					startPosition = beat;
					break;
				}
			}

			console.log('ShareButton: Start position found:', !!startPosition);

			// Export the sequence
			const result = await exportEnhancedImage(beatFrameElement, {
				beats: sequenceBeats as any,
				startPosition: startPosition as any,
				backgroundColor: settings.backgroundColor || '#FFFFFF',
				scale: 2,
				quality: settings.quality || 0.92,
				format: 'png',
				columns: 4,
				spacing: 0,
				// Always include start position if it exists
				includeStartPosition: true,
				// Enable all enhancement features by default, but respect user preferences if explicitly set
				addWord: settings.addWord !== false,
				addUserInfo: settings.addUserInfo !== false,
				addDifficultyLevel: settings.addDifficultyLevel !== false,
				addBeatNumbers: settings.addBeatNumbers !== false,
				addReversalSymbols: settings.addReversalSymbols !== false,
				title: sequenceName,
				userName: 'User',
				notes: 'Created using The Kinetic Constructor',
				difficultyLevel: sequence.metadata?.difficulty || 1
			});

			// Cache the result
			lastResult = result;

			return result;
		} catch (error) {
			console.error('Error rendering sequence:', error);
			logger.error('Error rendering sequence', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			return null;
		}
	}

	// Convert data URL to blob
	function dataURLtoBlob(dataUrl: string): Blob {
		const arr = dataUrl.split(',');
		const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);

		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}

		return new Blob([u8arr], { type: mime });
	}
</script>

<button
	class="share-button"
	onclick={toggleDropdown}
	aria-label="Share sequence"
	class:loading={isRendering}
>
	<div class="icon-wrapper">
		{#if isRendering}
			<i class="fa-solid fa-spinner fa-spin"></i>
		{:else}
			<i class="fa-solid fa-share-alt"></i>
		{/if}
	</div>
</button>

{#if isDropdownOpen}
	<div class="dropdown-container">
		<ShareDropdown onShare={handleShare} onDownload={handleDownload} onClose={closeDropdown} />
	</div>
{/if}

<style>
	/* Global styles to ensure consistent sizing with settings button */
	:global(.sequence-widget > .main-layout > .share-button) {
		position: absolute !important;
		top: calc(var(--button-size-factor, 1) * 10px) !important; /* Exactly match settings button */
		right: calc(
			var(--button-size-factor, 1) * 10px
		) !important; /* Mirror of settings button's left */
		width: calc(
			var(--button-size-factor, 1) * 45px
		) !important; /* Exact same size as settings button */
		height: calc(
			var(--button-size-factor, 1) * 45px
		) !important; /* Exact same size as settings button */
		z-index: 40 !important; /* Consistent with other FABs */
		margin: 0 !important; /* Override any default margin */
		display: flex !important; /* Ensure it's displayed */
		visibility: visible !important; /* Ensure it's visible */
		opacity: 1 !important; /* Ensure it's fully opaque */
	}

	/* Ensure the icon inside scales correctly */
	:global(.sequence-widget > .main-layout > .share-button i) {
		font-size: calc(
			var(--button-size-factor, 1) * 19px
		); /* Exact same icon size as settings button */
	}

	/* Position the dropdown container absolutely to prevent layout shifts */
	:global(.sequence-widget > .main-layout > .dropdown-container) {
		position: absolute !important;
		top: calc(
			var(--button-size-factor, 1) * 10px + var(--button-size-factor, 1) * 45px + 5px
		) !important;
		right: calc(var(--button-size-factor, 1) * 10px) !important;
		z-index: 41 !important; /* Slightly higher than the button */
	}

	.share-button {
		background-color: var(--tkc-button-panel-background, #2a2a2e);
		color: var(--tkc-icon-color-share, #00bcd4); /* Teal icon color, or a theme variable */
		border: none;
		border-radius: 50%; /* Perfectly round */
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
		overflow: hidden; /* Match settings button */
	}

	.share-button:hover {
		background-color: var(--tkc-button-panel-background-hover, #3c3c41);
		transform: translateY(-2px) scale(1.05);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.26);
		color: var(--tkc-icon-color-share-hover, #6c9ce9); /* Match settings button hover color */
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

	/* Add icon wrapper styles */
	.icon-wrapper {
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%; /* Ensure wrapper fills button for icon centering */
		height: 100%;
		color: inherit;
	}

	.icon-wrapper i {
		/* Font size is controlled by the global selector */
		line-height: 1;
		display: block;
		transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	/* Add a subtle scale effect on hover, similar to settings button */
	.share-button:hover .icon-wrapper i {
		transform: scale(1.1); /* Subtle scale effect */
	}

	/* Style for the dropdown container */
	.dropdown-container {
		position: absolute;
		z-index: 41;
	}
</style>
