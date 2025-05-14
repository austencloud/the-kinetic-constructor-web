<!--
  ShareButton Component

  This component provides a button for sharing and downloading sequence images.
  It uses the enhanced image exporter for reliable rendering.
-->
<script lang="ts">
	import { onMount } from '$lib/utils/svelte-lifecycle';
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
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// Track dropdown state
	let isDropdownOpen = $state(false);

	// Track rendering state
	let isRendering = $state(false);

	// Props
	const { beatFrameElement = null } = $props<{ beatFrameElement?: HTMLElement | null }>();

	// Track element references
	let beatFrameElementState = $state<HTMLElement | null>(beatFrameElement);

	// Update state when prop changes
	$effect(() => {
		if (beatFrameElement) {
			beatFrameElementState = beatFrameElement;
		}
	});

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
				beatFrameElementState = contextElement;
			}
		}
	});

	// Function to actively search for the BeatFrame element in DOM
	function findBeatFrameElement(): HTMLElement | null {
		console.log('ShareButton: Actively searching for BeatFrame element in DOM');

		// First try from context (most reliable)
		if (beatFrameContext) {
			const contextElement = beatFrameContext.getElement();
			if (contextElement) {
				console.log('ShareButton: Found element from context');
				return contextElement;
			}
		}

		// Try to find the element by class or ID
		const byClass = document.querySelector('.beat-frame') as HTMLElement | null;
		if (byClass) {
			console.log('ShareButton: Found element by class .beat-frame');
			return byClass;
		}

		// Try by specific container selectors
		const byContainer = document.querySelector(
			'.sequence-container .beat-frame-container'
		) as HTMLElement | null;
		if (byContainer) {
			console.log('ShareButton: Found element by container selector');
			return byContainer;
		}

		// Try to find element with SVGs inside (more generic approach)
		const svgContainers = Array.from(document.querySelectorAll('.sequence-widget svg')).map((svg) =>
			svg.closest('.sequence-widget > div')
		);
		if (svgContainers.length > 0 && svgContainers[0] instanceof HTMLElement) {
			console.log('ShareButton: Found container with SVGs');
			return svgContainers[0] as HTMLElement;
		}

		console.log('ShareButton: Could not find BeatFrame element in DOM');
		return null;
	}

	// Set up event listener for beatframe-element-available
	onMount(() => {
		// Try to find the element immediately on mount
		if (!beatFrameElementState) {
			const element = findBeatFrameElement();
			if (element) {
				beatFrameElementState = element;
			}
		}

		const handleElementAvailable = (event: CustomEvent) => {
			if (event.detail?.element) {
				console.log('ShareButton: Got element from event');
				beatFrameElementState = event.detail.element;
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
		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		isDropdownOpen = !isDropdownOpen;
	}

	// Close dropdown
	function closeDropdown() {
		isDropdownOpen = false;
	}

	// Handle share button click
	async function handleShare() {
		if (!browser) return;

		// Provide haptic feedback
		if (hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('success');
		}

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

		// Provide haptic feedback
		if (hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('success');
		}

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

			console.log('ShareButton: Starting download process');

			// Make one last attempt to find the element if it's not available
			if (!beatFrameElementState) {
				beatFrameElementState = findBeatFrameElement();

				if (!beatFrameElementState) {
					showError('Cannot find sequence display. Please try again.');
					isRendering = false;
					return;
				}
			}

			// Render the sequence
			const result = await renderSequence();

			if (!result) {
				showError('Failed to generate image for download');
				isRendering = false;
				return;
			}

			// Generate filename with better formatting
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
			const safeSequenceName = sequenceName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
			const filename = `kinetic-sequence-${safeSequenceName || timestamp}.png`;

			console.log('ShareButton: Downloading image with filename:', filename);
			console.log('ShareButton: Data URL length:', result.dataUrl.length);

			try {
				// Download the image with improved error handling
				const success = await downloadImage({
					dataUrl: result.dataUrl,
					filename
				});

				if (success) {
					showSuccess('Image download started');
					console.log('ShareButton: Download initiated successfully');
				} else {
					throw new Error('Download function returned false');
				}
			} catch (downloadError) {
				console.error('ShareButton: Download error:', downloadError);

				// Try alternative download approach
				try {
					console.log('ShareButton: Trying alternative download approach');

					// Create a new window with the image
					const newWindow = window.open();
					if (!newWindow) {
						throw new Error('Failed to open new window. Popup might be blocked.');
					}

					// Write the image to the new window with download instructions
					newWindow.document.write(`
						<html>
							<head>
								<title>${filename}</title>
								<style>
									body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; font-family: Arial, sans-serif; }
									img { max-width: 90%; max-height: 80vh; border: 1px solid #ccc; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
									.instructions { margin: 20px; padding: 15px; background: #2a2a2e; color: white; border-radius: 8px; text-align: center; max-width: 500px; }
								</style>
							</head>
							<body>
								<div class="instructions">
									<h3>Right-click on the image and select "Save Image As..." to download</h3>
									<p>If that doesn't work, try taking a screenshot of the image.</p>
								</div>
								<img src="${result.dataUrl}" alt="${filename}">
							</body>
						</html>
					`);

					showSuccess('Image opened in new window');
				} catch (alternativeError) {
					console.error('ShareButton: Alternative download approach failed:', alternativeError);
					showError('Failed to download sequence. Please try again.');
				}
			}
		} catch (error) {
			showError('Failed to download sequence');
			console.error('Download error:', error);
		} finally {
			isRendering = false;
		}
	}

	// Render the sequence
	async function renderSequence(): Promise<any> {
		// Try one last time to find the beat frame element
		if (!beatFrameElementState) {
			beatFrameElementState = findBeatFrameElement();
		}

		if (!browser || !beatFrameElementState) {
			console.error('Cannot render: not in browser environment or no beat frame element');

			// Try to find the element one more time using more aggressive selectors
			const alternativeElement =
				document.querySelector('.sequence-widget') ||
				document.querySelector('.sequence-container') ||
				document.querySelector('.sequence');

			if (alternativeElement instanceof HTMLElement) {
				console.log('ShareButton: Found alternative element for rendering:', alternativeElement);
				beatFrameElementState = alternativeElement;
			} else {
				return null;
			}
		}

		try {
			console.log('ShareButton: Starting sequence rendering');
			console.log('ShareButton: Beat frame element:', beatFrameElementState);

			// Get export settings
			let settings: any = {};
			try {
				// Get settings from localStorage first
				const savedSettings = localStorage.getItem('image-export-settings');
				if (savedSettings) {
					try {
						const parsed = JSON.parse(savedSettings);
						if (parsed && typeof parsed === 'object') {
							settings = parsed;
							console.log('ShareButton: Using settings from localStorage', settings);
						}
					} catch (parseError) {
						console.error('ShareButton: Failed to parse settings from localStorage', parseError);
					}
				}

				// If localStorage failed, get from store
				if (!settings || Object.keys(settings).length === 0) {
					const unsubscribe = imageExportSettings.subscribe((value: any) => {
						settings = value;
					});
					unsubscribe();
					console.log('ShareButton: Using settings from store', settings);
				}
			} catch (error) {
				console.error('ShareButton: Error getting export settings', error);
				// Use empty object, which will fall back to defaults
				settings = {};
			}

			console.log('ShareButton: Export settings:', settings);

			// Find the start position beat
			let startPosition = null;
			for (const beat of sequenceBeats) {
				if (beat.metadata?.isStartPosition) {
					startPosition = beat;
					break;
				}
			}

			console.log('ShareButton: Start position found:', !!startPosition);
			console.log('ShareButton: Sequence beats count:', sequenceBeats.length);

			// Ensure the beat frame element is fully rendered
			// Add a small delay to ensure all SVGs are fully rendered
			await new Promise((resolve) => setTimeout(resolve, 250));

			// Export the sequence with improved settings
			const result = await exportEnhancedImage(beatFrameElementState, {
				beats: sequenceBeats as any,
				startPosition: startPosition as any,
				backgroundColor: '#FFFFFF', // Always use white for better contrast
				scale: 2, // Higher scale for better quality
				quality: 1.0, // Always use maximum quality
				format: 'png', // PNG format for lossless quality
				columns: 4,
				spacing: 0,
				// Always include start position if it exists
				includeStartPosition: true,
				// Enable all enhancement features by default, but respect user preferences if explicitly set
				// Use more robust checks that handle undefined values correctly
				addWord: settings.addWord === undefined ? true : !!settings.addWord,
				addUserInfo: settings.addUserInfo === undefined ? true : !!settings.addUserInfo,
				addDifficultyLevel:
					settings.addDifficultyLevel === undefined ? true : !!settings.addDifficultyLevel,
				addBeatNumbers: settings.addBeatNumbers === undefined ? true : !!settings.addBeatNumbers,
				addReversalSymbols:
					settings.addReversalSymbols === undefined ? true : !!settings.addReversalSymbols,
				title: sequenceName,
				userName: 'User',
				notes: 'Created using The Kinetic Constructor',
				difficultyLevel: sequence.metadata?.difficulty || 1
			});

			console.log('ShareButton: Rendering completed successfully', {
				dataUrlLength: result?.dataUrl?.length || 0,
				width: result?.width || 0,
				height: result?.height || 0
			});

			// Validate the result
			if (!result || !result.dataUrl || result.dataUrl.length < 1000) {
				console.error('ShareButton: Invalid rendering result', result);
				throw new Error('Failed to generate a valid image');
			}

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
