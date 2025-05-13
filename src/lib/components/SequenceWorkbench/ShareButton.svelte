<!-- src/lib/components/SequenceWorkbench/ShareButton.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { logger } from '$lib/core/logging';
	import { showError } from '$lib/components/shared/ToastManager.svelte';
	import { isWebShareSupported, generateShareableUrl } from '$lib/utils/shareUtils';
	import { shareWithImage, downloadSequenceImage } from './utils/ShareUtils';
	import ShareDropdown from './ShareDropdown.svelte';
	import ShareRenderer from './ShareRenderer.svelte';

	// Props using Svelte 5 runes
	const props = $props<{
		beatFrameElement: HTMLElement | null;
		onShare?: () => void; // Optional callback
	}>();

	// Local state
	let isDropdownOpen = $state(false);
	let isSharing = $state(false);
	let shareUrl = $state('');
	let lastShareAttemptTime = 0;
	const MIN_SHARE_INTERVAL_MS = 1000; // Minimum 1 second between share attempts
	let isDownloading = $state(false);

	// Component references
	let shareRenderer: ShareRenderer;

	// Set up event listeners
	onMount(() => {
		console.log('ShareButton: onMount called');

		// Set up test utilities for debugging
		if (browser) {
			setupTestUtilities();
		}
	});

	// Clean up on destroy
	onDestroy(() => {
		console.log('ShareButton: onDestroy called');
	});

	// Generate share URL when sequence changes
	$effect(() => {
		if (shareRenderer && shareRenderer.sequenceName) {
			// Generate shareable URL based on the sequence
			try {
				const sequenceContainer = (window as any).__sequenceContainer;
				if (sequenceContainer && sequenceContainer.beats && sequenceContainer.beats.length > 0) {
					shareUrl = generateShareableUrl(sequenceContainer.beats, shareRenderer.sequenceName);
					console.log('ShareButton: Generated shareable URL:', shareUrl);
				} else {
					// Fallback to current URL if no sequence data available
					shareUrl = browser ? window.location.href : '';
					console.log('ShareButton: Using current URL as fallback:', shareUrl);
				}
			} catch (error) {
				console.error('ShareButton: Error generating shareable URL:', error);
				// Fallback to current URL
				shareUrl = browser ? window.location.href : '';
			}
		}
	});

	// Handle share button click
	async function handleClick() {
		console.log('ShareButton: handleClick called');

		// Call the original onShare callback if provided
		if (props.onShare) {
			console.log('ShareButton: Calling onShare callback');
			props.onShare();
		}

		// Check if already sharing to prevent multiple clicks
		if (isSharing) {
			console.log('ShareButton: Already sharing, ignoring click');
			return;
		}

		// Simply toggle the dropdown menu
		isDropdownOpen = !isDropdownOpen;
		console.log('ShareButton: Toggled dropdown menu, isDropdownOpen =', isDropdownOpen);

		// Pre-render the sequence image if we're opening the dropdown
		if (isDropdownOpen) {
			try {
				console.log('ShareButton: Pre-rendering sequence for dropdown options');
				isSharing = true;

				// Verify sequence data is available
				if (!shareRenderer) {
					console.error('ShareButton: ShareRenderer component not available');
					showError('Cannot share: Renderer not available. Please try again in a moment.');
					isSharing = false;
					return;
				}

				// Render the sequence in the background
				shareRenderer
					.renderSequence()
					.then((result) => {
						if (result) {
							console.log('ShareButton: Pre-rendered sequence successfully');
						}
					})
					.catch((error) => {
						console.error('ShareButton: Error pre-rendering sequence:', error);
					})
					.finally(() => {
						isSharing = false;
					});
			} catch (error) {
				console.error('ShareButton: Error in pre-rendering:', error);
				isSharing = false;
			}
		}
	}

	// Close dropdown
	function closeDropdown() {
		isDropdownOpen = false;
	}

	// Handle share action
	async function handleShare() {
		console.log('ShareButton: handleShare called');

		// Check if we're already in the process of sharing
		if (isSharing) {
			console.log('ShareButton: Already sharing, returning early');
			showError('Sharing already in progress, please wait');
			return;
		}

		// Check if we've attempted to share too recently
		const now = Date.now();
		const timeSinceLastAttempt = now - lastShareAttemptTime;
		if (timeSinceLastAttempt < MIN_SHARE_INTERVAL_MS) {
			console.log(
				`ShareButton: Share attempted too soon (${timeSinceLastAttempt}ms since last attempt)`
			);
			showError('Please wait a moment before sharing again');
			return;
		}

		// Update the last attempt time
		lastShareAttemptTime = now;

		try {
			console.log('ShareButton: Setting isSharing to true');
			isSharing = true;

			// Render the sequence
			console.log('ShareButton: Rendering sequence');
			const result = await shareRenderer.renderSequence();
			if (!result) {
				console.log('ShareButton: Failed to render sequence image');
				showError('Failed to render sequence image');
				isSharing = false;
				return;
			}

			// Reset sharing state before calling the share function
			// This is critical for desktop browsers where the share dialog might not appear
			isSharing = false;

			// Use the ShareUtils to share with image
			console.log('ShareButton: Calling shareWithImage from ShareUtils');
			const success = await shareWithImage(result, shareRenderer.sequenceName, shareUrl);

			if (success) {
				console.log('ShareButton: Share successful');
				// Close dropdown after successful sharing
				if (isDropdownOpen) {
					console.log('ShareButton: Closing dropdown after successful share');
					closeDropdown();
				}
			} else {
				console.log('ShareButton: Share failed or was cancelled');
			}
		} catch (error) {
			console.error('ShareButton: Error in handleShare:', error);
			logger.error('Error sharing sequence', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			showError('Failed to share sequence. Please try again.');
		} finally {
			// Ensure sharing state is reset
			console.log('ShareButton: Setting isSharing to false in finally block');
			isSharing = false;
		}
	}

	// Handle download action
	async function handleDownload() {
		console.log('ShareButton: handleDownload called');

		// Check if we're already in the process of downloading
		if (isDownloading) {
			console.log('ShareButton: Already downloading, returning early');
			showError('Download already in progress, please wait');
			return;
		}

		isDownloading = true;

		try {
			// Render the sequence
			console.log('ShareButton: Rendering sequence for download');
			const result = await shareRenderer.renderSequence();
			if (!result) {
				console.log('ShareButton: Failed to render sequence image for download');
				showError('Failed to generate image for download');
				return;
			}

			// Use the ShareUtils to download the image
			console.log('ShareButton: Calling downloadSequenceImage from ShareUtils');
			await downloadSequenceImage(result, shareRenderer.sequenceName);
		} catch (error) {
			console.error('ShareButton: Error in handleDownload:', error);
			logger.error('Error downloading sequence image', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			showError('Failed to download image. Please try again.');
		} finally {
			// Reset the downloading state after a delay
			setTimeout(() => {
				isDownloading = false;
			}, 1000);
		}
	}

	// Set up test utilities for debugging
	function setupTestUtilities() {
		// Expose test functions to the global window object
		(window as any).shareButtonTest = {
			// Test the click handler directly
			testClickHandler: async () => {
				console.log('Test: Calling handleClick directly');
				try {
					await handleClick();
					return true;
				} catch (error) {
					console.error('Test: Error in handleClick:', error);
					return false;
				}
			},

			// Test sharing
			testShare: async () => {
				console.log('Test: Testing share functionality');
				try {
					await handleShare();
					return true;
				} catch (error) {
					console.error('Test: Error in handleShare:', error);
					return false;
				}
			},

			// Test downloading
			testDownload: async () => {
				console.log('Test: Testing download functionality');
				try {
					await handleDownload();
					return true;
				} catch (error) {
					console.error('Test: Error in handleDownload:', error);
					return false;
				}
			},

			// Get current state
			getState: () => {
				return {
					isSharing,
					isDropdownOpen,
					shareUrl,
					hasShareRenderer: !!shareRenderer
				};
			}
		};

		console.log(
			'ShareButton: Test utilities initialized. Access via window.shareButtonTest in the console.'
		);
	}
</script>

<!-- Hidden ShareRenderer component -->
<ShareRenderer bind:this={shareRenderer} beatFrameElement={props.beatFrameElement} />

<!-- Share button -->
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

<!-- Dropdown menu -->
{#if isDropdownOpen}
	<div class="dropdown-container">
		<ShareDropdown onShare={handleShare} onDownload={handleDownload} onClose={closeDropdown} />
	</div>
{/if}

<style>
	/* Global styles to ensure consistent sizing with settings button */
	:global(.sequence-widget > .main-layout > .share-button) {
		position: absolute;
		top: calc(var(--button-size-factor, 1) * 10px); /* Exactly match settings button */
		right: calc(var(--button-size-factor, 1) * 10px); /* Mirror of settings button's left */
		width: calc(var(--button-size-factor, 1) * 45px); /* Exact same size as settings button */
		height: calc(var(--button-size-factor, 1) * 45px); /* Exact same size as settings button */
		z-index: 40; /* Consistent with other FABs */
		margin: 0 !important; /* Override any default margin */
	}

	/* Ensure the icon inside scales correctly */
	:global(.sequence-widget > .main-layout > .share-button i) {
		font-size: calc(
			var(--button-size-factor, 1) * 19px
		); /* Exact same icon size as settings button */
	}

	/* Position the dropdown container relative to the button */
	:global(.sequence-widget > .main-layout > .dropdown-container) {
		position: absolute;
		top: calc(var(--button-size-factor, 1) * 10px + var(--button-size-factor, 1) * 45px + 5px);
		right: calc(var(--button-size-factor, 1) * 10px);
		z-index: 41; /* Slightly higher than the button */
	}

	.share-button {
		/* Base sizes for dynamic scaling */
		--base-size: 45px; /* Base size of the button */
		--base-icon-size: 19px; /* Base size of the icon */
		--base-margin: 10px; /* Base margin from corner */

		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--tkc-button-panel-background, #2a2a2e);
		color: var(--tkc-icon-color-share, #00bcd4); /* Teal icon color, or a theme variable */
		border-radius: 50%; /* Perfectly round */
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

	.share-button.active {
		background-color: var(--tkc-button-active-background, #00bcd4);
		color: var(--tkc-button-active-color, #ffffff);
		transform: scale(1.05);
		box-shadow: 0 0 12px rgba(0, 188, 212, 0.4);
	}

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
		/* Font size is now controlled by the global selector */
		line-height: 1;
		display: block;
		transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	/* Optional: Add a subtle rotation effect on hover, different from settings gear rotation */
	.share-button:hover .icon-wrapper i {
		transform: scale(1.1); /* Subtle scale effect instead of rotation */
	}

	/* Style for the dropdown container */
	.dropdown-container {
		position: relative;
		z-index: 41;
	}
</style>
