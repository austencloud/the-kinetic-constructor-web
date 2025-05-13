<!-- src/lib/components/SequenceWorkbench/ShareNative.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
	import { logger } from '$lib/core/logging';
	import {
		renderSequence,
		dataURLtoBlob,
		generateFilename,
		getLastRenderResult
	} from './ShareSequenceRenderer';
	import {
		isWebShareSupported,
		isFileShareSupported
	} from '$lib/components/SequenceWorkbench/share/utils/ShareUtils';
	import type { ShareData } from '$lib/components/SequenceWorkbench/share/utils/ShareUtils';

	// Props
	export let sequenceName: string = '';
	export let shareUrl: string = '';
	export let contextElement: HTMLElement | null = null;
	export let currentWord: string = '';
	export let onComplete: () => void = () => {};

	// State
	let isSharing = false;
	let lastShareAttemptTime = 0;
	const MIN_SHARE_INTERVAL_MS = 1000; // Minimum 1 second between share attempts

	// Track the last time a share API call was made
	let lastShareApiCallTime = 0;
	const MIN_SHARE_API_INTERVAL_MS = 1500; // Minimum 1.5 seconds between Web Share API calls

	/**
	 * Share the sequence using the Web Share API
	 */
	async function shareSequence(): Promise<boolean> {
		console.log('ShareNative: shareSequence called');

		// Check if we're already in the process of sharing
		if (isSharing) {
			console.log('ShareNative: Already sharing, returning early');
			showError('Sharing already in progress, please wait');
			return false;
		}

		// Check if we've attempted to share too recently
		const now = Date.now();
		const timeSinceLastAttempt = now - lastShareAttemptTime;
		if (timeSinceLastAttempt < MIN_SHARE_INTERVAL_MS) {
			console.log(
				`ShareNative: Share attempted too soon (${timeSinceLastAttempt}ms since last attempt)`
			);
			showError('Please wait a moment before sharing again');
			return false;
		}

		// Update the last attempt time
		lastShareAttemptTime = now;
		isSharing = true;

		// Create a cleanup function to ensure sharing state is reset
		const resetSharingState = () => {
			// Use a small timeout to ensure any pending operations complete
			setTimeout(() => {
				if (isSharing) {
					console.log('ShareNative: Resetting sharing state via cleanup function');
					isSharing = false;
				}
			}, 500);
		};

		try {
			// Check if Web Share API is supported
			if (!browser || !isWebShareSupported()) {
				console.log('ShareNative: Web Share API not supported');
				showError("Your device doesn't support sharing");
				resetSharingState();
				return false;
			}

			// Check if we've attempted to use the Web Share API too recently
			const timeSinceLastApiCall = now - lastShareApiCallTime;
			if (timeSinceLastApiCall < MIN_SHARE_API_INTERVAL_MS) {
				console.log(
					`ShareNative: Web Share API called too soon (${timeSinceLastApiCall}ms since last attempt)`
				);
				showError('Please wait a moment before sharing again');
				resetSharingState();
				return false;
			}

			// Try to use the last render result first
			let result = getLastRenderResult();

			// If no cached result, render the sequence
			if (!result) {
				console.log('ShareNative: No cached render result, rendering sequence');
				result = await renderSequence({
					contextElement,
					sequenceName,
					currentWord
				});
			}

			if (!result) {
				console.log('ShareNative: Failed to render sequence image');
				showError('Failed to generate image for sharing');
				resetSharingState();
				return false;
			}

			// Prepare the share text
			const shareTitle = 'Kinetic Constructor Sequence';
			const shareText = `Check out this sequence${sequenceName ? ': ' + sequenceName : ''}\n\nOpen this link to reconstruct: ${shareUrl}`;

			// Update the last API call time
			lastShareApiCallTime = now;

			// First try to share with image if file sharing is supported
			const fileShareSupported = isFileShareSupported();
			console.log('ShareNative: File sharing supported:', fileShareSupported);

			if (fileShareSupported && result) {
				try {
					// Convert the data URL to a Blob
					console.log('ShareNative: Converting data URL to Blob');
					const blob = dataURLtoBlob(result.dataUrl);

					// Create a File from the Blob
					console.log('ShareNative: Creating File from Blob');
					const fileName = generateFilename(sequenceName);
					const file = new File([blob], fileName, { type: 'image/png' });

					// Create share data with the image file
					const shareData: ShareData = {
						title: shareTitle,
						text: shareText,
						url: shareUrl,
						files: [file]
					};

					// Check if the device can share this content with files
					if (navigator.canShare && navigator.canShare(shareData)) {
						console.log('ShareNative: Device can share with files, calling navigator.share');

						// Use a small timeout to ensure the browser is ready
						await new Promise((resolve) => setTimeout(resolve, 100));

						// Reset the sharing state before calling navigator.share
						// This is important for desktop browsers where the share dialog might not appear
						isSharing = false;

						await navigator.share(shareData);
						console.log('ShareNative: Share with files completed successfully');
						showSuccess('Sequence shared successfully');

						// Call the onComplete callback
						onComplete();
						return true;
					} else {
						console.log(
							'ShareNative: Device cannot share with files, falling back to text+URL only'
						);
						// Fall through to text+URL sharing
					}
				} catch (fileError) {
					// If there's an error with file sharing, log it and fall back to text+URL sharing
					if (fileError instanceof Error && fileError.name === 'AbortError') {
						console.log('ShareNative: User cancelled file sharing');
						resetSharingState();

						// Call the onComplete callback
						onComplete();
						return false;
					}

					console.warn(
						'ShareNative: Error sharing with file, falling back to text+URL only:',
						fileError
					);
					// Fall through to text+URL sharing
				}
			}

			// Fallback to sharing just the text and URL
			console.log('ShareNative: Attempting to share with text and URL only');
			const textOnlyShareData: ShareData = {
				title: shareTitle,
				text: shareText,
				url: shareUrl
			};

			// Use a small timeout to ensure the browser is ready
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Reset the sharing state before calling navigator.share
			// This is important for desktop browsers where the share dialog might not appear
			isSharing = false;

			await navigator.share(textOnlyShareData);
			console.log('ShareNative: Text+URL share completed successfully');
			showSuccess('Sequence shared successfully');

			// Call the onComplete callback
			onComplete();
			return true;
		} catch (error) {
			// Don't show error for user cancellation
			if (error instanceof Error && error.name === 'AbortError') {
				console.log('ShareNative: User cancelled sharing');

				// Call the onComplete callback
				onComplete();
				return false;
			}

			console.error('ShareNative: Error in shareSequence:', error);
			logger.error('Error sharing sequence', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			showError('Failed to share sequence. Please try again.');

			// Call the onComplete callback
			onComplete();
			return false;
		} finally {
			// Reset the sharing state
			console.log('ShareNative: Setting isSharing to false in finally block');
			isSharing = false;

			// Double-check that sharing state is reset after a delay
			setTimeout(() => {
				if (isSharing) {
					console.log('ShareNative: Resetting sharing state in delayed check');
					isSharing = false;
				}
			}, 1000);
		}
	}

	// Export the share function for external use
	export function share(): Promise<boolean> {
		return shareSequence();
	}
</script>
