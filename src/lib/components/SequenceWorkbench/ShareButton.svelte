<!-- src/lib/components/SequenceWorkbench/ShareButton.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import type { BeatData as ContainerBeatData } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import {
		renderSequenceToImage,
		downloadDataUrl,
		createRenderOptionsFromSettings
	} from '$lib/utils/sequenceImageRenderer';
	import type { SequenceRenderResult } from '$lib/utils/sequenceImageRenderer';
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
	import { imageExportSettings, type ImageExportSettings } from '$lib/state/image-export-settings';
	import { browser } from '$app/environment';

	// Utility function to safely log state objects
	function safeLog(message: string, stateObj: any): void {
		if (typeof stateObj === 'object' && stateObj !== null) {
			// Create a plain object copy to avoid logging proxies
			const plainObj = JSON.parse(JSON.stringify(stateObj));
			console.log(message, plainObj);
		} else {
			console.log(message, stateObj);
		}
	}

	// Props using Svelte 5 runes
	const props = $props<{
		beatFrameElement: HTMLElement | null;
		onShare?: () => void; // Optional callback
	}>();

	// Local state for element references
	let cachedBeatFrameElement = $state<HTMLElement | null>(null);
	let elementSearchInProgress = $state(false);

	// Log the beatFrameElement when it changes and cache it
	$effect(() => {
		console.log('ShareButton: beatFrameElement prop changed:', props.beatFrameElement);

		if (props.beatFrameElement) {
			cachedBeatFrameElement = props.beatFrameElement;
			console.log('ShareButton: Cached beatFrameElement from props');

			// Store in global fallback as well
			if (browser) {
				(window as any).__cachedBeatFrameElement = props.beatFrameElement;
			}
		} else if (browser && (window as any).__beatFrameElementRef) {
			// Try to get from global fallback
			cachedBeatFrameElement = (window as any).__beatFrameElementRef;
			console.log('ShareButton: Using global fallback for beatFrameElement');
		} else if (browser && (window as any).__cachedBeatFrameElement) {
			// Try to get from our own cached reference
			cachedBeatFrameElement = (window as any).__cachedBeatFrameElement;
			console.log('ShareButton: Using previously cached beatFrameElement');
		}
	});

	// Set up listeners for element availability
	onMount(() => {
		if (browser) {
			// Listen for the custom event
			const handleBeatFrameElementAvailable = (event: CustomEvent) => {
				console.log('ShareButton: Received beatframe-element-available event');
				if (event.detail && event.detail.element) {
					cachedBeatFrameElement = event.detail.element;
					(window as any).__cachedBeatFrameElement = event.detail.element;
					console.log('ShareButton: Updated cachedBeatFrameElement from event');
				}
			};

			document.addEventListener(
				'beatframe-element-available',
				handleBeatFrameElementAvailable as EventListener
			);

			// Set up a MutationObserver to detect when the BeatFrame element is added to the DOM
			const observer = new MutationObserver(() => {
				if (!cachedBeatFrameElement && !elementSearchInProgress) {
					elementSearchInProgress = true;

					// Try to find the BeatFrame element in the DOM
					setTimeout(() => {
						findBeatFrameElementInDOM().then((element) => {
							if (element) {
								cachedBeatFrameElement = element;
								(window as any).__cachedBeatFrameElement = element;
								console.log('ShareButton: Found BeatFrame element via DOM search');
							}
							elementSearchInProgress = false;
						});
					}, 100);
				}
			});

			// Start observing the document body for DOM changes
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});

			// Initial search for the element
			if (!cachedBeatFrameElement && !props.beatFrameElement) {
				elementSearchInProgress = true;
				findBeatFrameElementInDOM().then((element) => {
					if (element) {
						cachedBeatFrameElement = element;
						(window as any).__cachedBeatFrameElement = element;
						console.log('ShareButton: Found BeatFrame element via initial DOM search');
					}
					elementSearchInProgress = false;
				});
			}

			return () => {
				// Clean up the event listener and observer when the component is destroyed
				document.removeEventListener(
					'beatframe-element-available',
					handleBeatFrameElementAvailable as EventListener
				);
				observer.disconnect();
			};
		}
	});

	const sequence = useContainer(sequenceContainer);

	// Local state
	let isDropdownOpen = $state(false);
	let shareUrl = $state('');
	let isSharing = $state(false);
	let sequenceName = $state('');
	let lastRenderResult: SequenceRenderResult | null = $state(null);
	let sequenceLoaded = $state(false);
	let sequenceBeatsCache: any[] = $state([]);

	// Helper function to find the BeatFrame element in the DOM
	async function findBeatFrameElementInDOM(): Promise<HTMLElement | null> {
		console.log('ShareButton: Searching for BeatFrame element in DOM');

		// Try to find the BeatFrame element in the DOM
		const beatFrameElements = document.querySelectorAll('.beat-frame-container');
		if (beatFrameElements.length > 0) {
			console.log('ShareButton: Found .beat-frame-container element');
			return beatFrameElements[0] as HTMLElement;
		}

		// Try to find the beat-frame element
		const beatFrames = document.querySelectorAll('.beat-frame');
		if (beatFrames.length > 0) {
			console.log('ShareButton: Found .beat-frame element');
			return beatFrames[0] as HTMLElement;
		}

		// Try to find the sequence-widget element
		const sequenceWidgets = document.querySelectorAll('.sequence-widget');
		if (sequenceWidgets.length > 0) {
			console.log('ShareButton: Found .sequence-widget element');
			return sequenceWidgets[0] as HTMLElement;
		}

		console.log('ShareButton: No BeatFrame element found in DOM');
		return null;
	}

	// Monitor sequence data availability
	$effect(() => {
		const currentBeats = sequence.beats;
		console.log('ShareButton: Sequence beats updated, count:', currentBeats?.length || 0);

		// Cache the sequence beats for reliability
		if (currentBeats && Array.isArray(currentBeats)) {
			sequenceBeatsCache = [...currentBeats];
			sequenceLoaded = currentBeats.length > 0;
			console.log('ShareButton: Sequence beats cached, loaded:', sequenceLoaded);
		} else {
			console.warn('ShareButton: Sequence beats not available or not an array');
			sequenceLoaded = false;
		}
	});

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

		try {
			console.log('ShareButton: Setting isSharing to true');
			isSharing = true;

			// Verify BeatFrame element is available before proceeding
			const hasElement =
				props.beatFrameElement ||
				cachedBeatFrameElement ||
				(browser &&
					((window as any).__beatFrameElementRef || (window as any).__cachedBeatFrameElement)) ||
				document.querySelectorAll('.beat-frame, .beat-frame-container, .sequence-widget').length >
					0;

			if (!hasElement) {
				console.error('ShareButton: No BeatFrame element found anywhere');
				showError('Cannot share: Beat frame not found. Please try again in a moment.');

				// Try one last time to find the element
				findBeatFrameElementInDOM().then((element) => {
					if (element) {
						cachedBeatFrameElement = element;
						if (browser) {
							(window as any).__cachedBeatFrameElement = element;
						}
						console.log(
							'ShareButton: Found element after error, will be available for next attempt'
						);
						showSuccess('Element found. Please try sharing again.');
					}
				});

				return;
			}

			// Use cached sequence beats for reliability
			const currentSequenceBeats =
				sequenceBeatsCache.length > 0 ? sequenceBeatsCache : sequence.beats;
			safeLog('ShareButton: Current sequence beats:', currentSequenceBeats);

			// Check if there are beats to share
			if (!currentSequenceBeats || currentSequenceBeats.length === 0) {
				console.log('ShareButton: No beats to share');
				showError('No sequence to share. Please add some beats first.');
				return;
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
				console.error('ShareButton: Sequence data is invalid or incomplete');
				showError('Cannot share: Sequence data is incomplete. Please try again.');
				return;
			}

			console.log('ShareButton: Attempting to render sequence');
			// Always render a fresh image to ensure latest settings are applied
			const result = await renderSequence();
			if (!result) {
				console.log('ShareButton: Failed to render sequence image');
				showError('Failed to render sequence image. Please try again.');
				return;
			}
			safeLog('ShareButton: Sequence rendered successfully', result);

			// Save the result for potential reuse
			lastRenderResult = result;

			// Check if file sharing is supported
			const fileShareSupported = isFileShareSupported();
			console.log('ShareButton: File sharing supported:', fileShareSupported);

			if (!fileShareSupported) {
				console.log('ShareButton: File sharing not supported, falling back to basic sharing');
				logger.warn('File sharing not supported, falling back to basic sharing');

				// Fall back to basic sharing if file sharing is not supported
				const shareData: ShareData = {
					title: 'Kinetic Constructor Sequence',
					text: `Check out this sequence: ${sequenceName}`,
					url: shareUrl
				};
				safeLog('ShareButton: Share data for basic sharing:', shareData);

				const webShareSupported = isWebShareSupported();
				console.log('ShareButton: Web Share API supported:', webShareSupported);

				if (webShareSupported) {
					console.log('ShareButton: Attempting to share with Web Share API');
					await shareSequence(shareData);
					showSuccess('Sequence shared successfully');
				} else {
					console.log('ShareButton: Web Share API not supported, showing dropdown');
					// If web sharing is also not supported, show the dropdown
					isDropdownOpen = !isDropdownOpen;
				}
				return;
			}

			console.log('ShareButton: Attempting to share sequence with image');
			// Share the sequence with the image
			const success = await shareSequenceWithImage(result, sequenceName, shareUrl);
			console.log('ShareButton: Share with image result:', success);

			if (success) {
				console.log('ShareButton: Share successful, showing success message');
				showSuccess('Sequence shared with image');
			} else {
				// If sharing failed but we have the image, offer download as fallback
				console.log('ShareButton: Sharing failed, offering download option');
				isDropdownOpen = true;
				showError('Could not share directly. Please use the download option instead.');
			}
		} catch (error) {
			console.error('ShareButton: Error in handleClick:', error);
			logger.error('Error sharing sequence', {
				error: error instanceof Error ? error : new Error(String(error))
			});

			// Provide more specific error messages based on the error
			if (error instanceof Error) {
				if (error.message.includes('BeatFrame') || error.message.includes('element')) {
					showError('Could not find the sequence to share. Please try again in a moment.');
				} else if (error.message.includes('sequence') || error.message.includes('beats')) {
					showError('Sequence data is not ready. Please try again in a moment.');
				} else {
					showError('Failed to share sequence: ' + error.message);
				}
			} else {
				showError('Failed to share sequence. Please try again.');
			}
		} finally {
			console.log('ShareButton: Setting isSharing to false');
			isSharing = false;
		}
	}

	// Close dropdown
	function closeDropdown() {
		isDropdownOpen = false;
	}

	// Render the sequence to an image
	async function renderSequence(): Promise<SequenceRenderResult | null> {
		console.log('ShareButton: renderSequence called');
		console.log('- props.beatFrameElement:', props.beatFrameElement);
		console.log('- cachedBeatFrameElement:', cachedBeatFrameElement);
		console.log('- global fallback:', browser ? (window as any).__beatFrameElementRef : null);
		console.log(
			'- cached global fallback:',
			browser ? (window as any).__cachedBeatFrameElement : null
		);

		// Try all possible sources for the BeatFrame element
		let beatFrameElement = props.beatFrameElement || cachedBeatFrameElement;

		// If we still don't have an element, check global fallbacks
		if (!beatFrameElement && browser) {
			beatFrameElement =
				(window as any).__beatFrameElementRef || (window as any).__cachedBeatFrameElement;
			if (beatFrameElement) {
				console.log('ShareButton: Using global fallback for beatFrameElement');
			}
		}

		// Wait a short time to ensure DOM is fully rendered if needed
		if (!beatFrameElement) {
			console.log(
				'ShareButton: BeatFrame element not provided, waiting briefly for DOM to render...'
			);
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Try again after waiting
			beatFrameElement = props.beatFrameElement || cachedBeatFrameElement;

			if (!beatFrameElement && browser) {
				beatFrameElement =
					(window as any).__beatFrameElementRef || (window as any).__cachedBeatFrameElement;
			}
		}

		// If we still don't have an element, search the DOM
		if (!beatFrameElement) {
			console.log('ShareButton: Still no element, searching the DOM directly');
			beatFrameElement = await findBeatFrameElementInDOM();

			// Cache the found element for future use
			if (beatFrameElement) {
				cachedBeatFrameElement = beatFrameElement;
				if (browser) {
					(window as any).__cachedBeatFrameElement = beatFrameElement;
				}
			}
		}

		// Final check - if we still don't have an element, try one last desperate search
		if (!beatFrameElement) {
			console.log('ShareButton: Last resort DOM search for any possible container');

			// Try to find ANY element that might work
			const possibleContainers = document.querySelectorAll(
				'.beat-frame, .beat-frame-container, .sequence-widget, .sequence-container, .main-layout, .pictograph-wrapper'
			);

			if (possibleContainers.length > 0) {
				beatFrameElement = possibleContainers[0] as HTMLElement;
				console.log('ShareButton: Found last resort element:', beatFrameElement);

				// Cache it
				cachedBeatFrameElement = beatFrameElement;
				if (browser) {
					(window as any).__cachedBeatFrameElement = beatFrameElement;
				}
			}
		}

		// If we STILL don't have an element, give up
		if (!beatFrameElement) {
			console.error(
				'ShareButton: BeatFrame element not available for image export after all attempts.'
			);
			logger.error('BeatFrame element not available for image export after all attempts.');
			throw new Error('BeatFrame element not available for image export');
		}

		console.log('ShareButton: Using beatFrameElement for rendering:', beatFrameElement);

		// Use cached sequence beats for reliability
		const currentSequenceBeats =
			sequenceBeatsCache.length > 0 ? sequenceBeatsCache : sequence.beats;

		if (!currentSequenceBeats || currentSequenceBeats.length === 0) {
			console.warn('ShareButton: No beats in the current sequence to export.');
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
			console.error('ShareButton: Sequence data is invalid or incomplete');
			logger.error('Sequence data is invalid or incomplete');
			throw new Error('Sequence data is invalid or incomplete');
		}

		console.log('ShareButton: Preparing beats for rendering, count:', currentSequenceBeats.length);

		try {
			const beatsToRender: RendererBeatData[] = currentSequenceBeats.map(
				(beat: ContainerBeatData) => {
					try {
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
					} catch (err) {
						console.error('ShareButton: Error processing beat data:', err, beat);
						// Return a minimal valid beat to prevent the entire rendering from failing
						return {
							id: beat.id || crypto.randomUUID(),
							beatNumber: beat.number || 0,
							filled: true,
							pictographData: {
								letter: null,
								startPos: null,
								endPos: null,
								gridMode: 'diamond',
								redPropData: null,
								bluePropData: null,
								redMotionData: null,
								blueMotionData: null,
								redArrowData: null,
								blueArrowData: null,
								grid: '',
								timing: null,
								direction: null,
								gridData: null
							},
							duration: 1,
							metadata: {}
						};
					}
				}
			);

			// Get current settings from the store
			let currentSettings: ImageExportSettings = {
				includeStartPosition: true,
				addUserInfo: true,
				addWord: true,
				addDifficultyLevel: false,
				addBeatNumbers: true,
				addReversalSymbols: true,
				combinedGrids: false,
				backgroundColor: '#2a2a2e',
				quality: 0.92
			};

			try {
				const unsubscribe = imageExportSettings.subscribe((value) => {
					currentSettings = value;
				});
				unsubscribe();
			} catch (err) {
				console.warn('ShareButton: Error getting image export settings, using defaults:', err);
			}

			// Use the settings to generate options
			const options = createRenderOptionsFromSettings(beatsToRender, currentSettings, {
				userName: 'User', // Replace with actual username if available
				notes: 'Created with Kinetic Constructor',
				exportDate: new Date().toLocaleDateString()
			});

			console.log('ShareButton: Looking for .beat-frame element within beatFrameElement');
			// Try to find the .beat-frame element within the container
			let imageToRenderElement: HTMLElement | null = null;

			// First try to find .beat-frame within the provided element
			if (beatFrameElement.querySelector) {
				const beatFrameChild = beatFrameElement.querySelector('.beat-frame');
				if (beatFrameChild) {
					console.log('ShareButton: Found .beat-frame child element');
					imageToRenderElement = beatFrameChild as HTMLElement;
				}
			}

			// If not found, use the element itself
			if (!imageToRenderElement) {
				console.log('ShareButton: Using beatFrameElement directly');
				imageToRenderElement = beatFrameElement;
			}

			if (!imageToRenderElement) {
				throw new Error('Could not find element to render');
			}

			// Ensure the element is visible and has dimensions
			const rect = imageToRenderElement.getBoundingClientRect();
			console.log('ShareButton: Element dimensions:', rect.width, 'x', rect.height);

			if (rect.width === 0 || rect.height === 0) {
				console.warn('ShareButton: Element has zero dimensions, may not render correctly');
			}

			console.log('ShareButton: Rendering sequence to image with element:', imageToRenderElement);
			return await renderSequenceToImage(imageToRenderElement, options);
		} catch (error) {
			console.error('ShareButton: Error rendering sequence to image:', error);
			logger.error('Error rendering sequence to image:', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			throw new Error(
				`Failed to render sequence as image: ${error instanceof Error ? error.message : String(error)}`
			);
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

	// Share sequence with image - used by the dropdown
	async function shareSequenceWithImageHandler() {
		console.log('ShareButton: shareSequenceWithImageHandler called from dropdown');

		// This function is now only used from the dropdown
		// We'll use a similar approach as the handleClick function
		if (isSharing) {
			console.log('ShareButton: Already sharing, returning early');
			return;
		}

		try {
			console.log('ShareButton: Setting isSharing to true');
			isSharing = true;

			// Render the sequence
			const result = await renderSequence();
			if (!result) {
				console.log('ShareButton: Failed to render sequence image');
				showError('Failed to render sequence image');
				return;
			}

			// Save the result
			lastRenderResult = result;

			// Share with image
			const success = await shareSequenceWithImage(result, sequenceName, shareUrl);

			if (success) {
				console.log('ShareButton: Share successful, showing success message');
				showSuccess('Sequence shared with image');
			}

			// Close dropdown after sharing
			if (isDropdownOpen) {
				console.log('ShareButton: Closing dropdown');
				closeDropdown();
			}
		} catch (error) {
			console.error('ShareButton: Error in shareSequenceWithImageHandler:', error);
			logger.error('Error sharing sequence with image', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			showError('Failed to share sequence with image');
		} finally {
			console.log('ShareButton: Setting isSharing to false');
			isSharing = false;
		}
	}

	// Test utility functions that can be called from the browser console
	if (browser) {
		// Expose test functions to the global window object
		(window as any).shareButtonTest = {
			// Test if Web Share API is supported
			testWebShareSupport: () => {
				console.log('Test: Checking Web Share API support');
				const supported = isWebShareSupported();
				console.log('Test: Web Share API supported:', supported);
				return supported;
			},

			// Test if File Share API is supported
			testFileShareSupport: () => {
				console.log('Test: Checking File Share API support');
				const supported = isFileShareSupported();
				console.log('Test: File Share API supported:', supported);
				return supported;
			},

			// Test sequence data availability
			testSequenceData: () => {
				console.log('Test: Checking sequence data');

				// Check both the original sequence and our cached version
				const currentSequenceBeats = sequence.beats;
				console.log('Test: Current sequence beats from container:', currentSequenceBeats);
				console.log('Test: Cached sequence beats:', sequenceBeatsCache);

				// Verify the data structure
				if (currentSequenceBeats && currentSequenceBeats.length > 0) {
					console.log('Test: First beat sample:', currentSequenceBeats[0]);

					// Check for required properties
					const firstBeat = currentSequenceBeats[0];
					console.log('Test: Beat properties check:');
					console.log('- id:', firstBeat.id);
					console.log('- letter:', firstBeat.letter);
					console.log('- position:', firstBeat.position);
					console.log('- metadata:', firstBeat.metadata);

					if (firstBeat.metadata) {
						console.log('- metadata.letter:', firstBeat.metadata.letter);
						console.log('- metadata.startPos:', firstBeat.metadata.startPos);
					}
				}

				// Force a refresh of the cache
				if (currentSequenceBeats && Array.isArray(currentSequenceBeats)) {
					sequenceBeatsCache = [...currentSequenceBeats];
					console.log('Test: Refreshed sequence beats cache');
				}

				return {
					hasBeats: currentSequenceBeats && currentSequenceBeats.length > 0,
					beatCount: currentSequenceBeats ? currentSequenceBeats.length : 0,
					cachedBeatCount: sequenceBeatsCache.length,
					sequenceLoaded: sequenceLoaded,
					beats: currentSequenceBeats,
					cachedBeats: sequenceBeatsCache
				};
			},

			// Test rendering sequence to image
			testRenderSequence: async () => {
				console.log('Test: Attempting to render sequence');
				try {
					// First check sequence data
					console.log('Test: Checking sequence data before rendering');
					const sequenceData = (window as any).shareButtonTest.testSequenceData();
					console.log('Test: Sequence data check result:', sequenceData);

					if (!sequenceData.hasBeats) {
						console.error('Test: No sequence beats available for rendering');
						return null;
					}

					// Log DOM state for debugging
					console.log('Test: DOM state before rendering:');
					console.log('- beatFrameElement prop:', props.beatFrameElement);

					const beatFrameElements = document.querySelectorAll('.beat-frame');
					console.log('- .beat-frame elements in DOM:', beatFrameElements.length);
					if (beatFrameElements.length > 0) {
						const firstElement = beatFrameElements[0] as HTMLElement;
						console.log('  First .beat-frame element:', firstElement);
						console.log('  Dimensions:', firstElement.getBoundingClientRect());
						console.log('  Visibility:', window.getComputedStyle(firstElement).visibility);
						console.log('  Display:', window.getComputedStyle(firstElement).display);
					}

					const beatFrameContainers = document.querySelectorAll('.beat-frame-container');
					console.log('- .beat-frame-container elements in DOM:', beatFrameContainers.length);
					if (beatFrameContainers.length > 0) {
						const firstContainer = beatFrameContainers[0] as HTMLElement;
						console.log('  First .beat-frame-container element:', firstContainer);
						console.log('  Dimensions:', firstContainer.getBoundingClientRect());
						console.log('  Visibility:', window.getComputedStyle(firstContainer).visibility);
						console.log('  Display:', window.getComputedStyle(firstContainer).display);
					}

					// Try to force a refresh of the cached sequence data
					if (sequenceBeatsCache.length === 0 && sequence.beats && sequence.beats.length > 0) {
						console.log('Test: Refreshing sequence beats cache before rendering');
						sequenceBeatsCache = [...sequence.beats];
					}

					// Wait a moment to ensure DOM is fully rendered
					console.log('Test: Waiting briefly for DOM to stabilize...');
					await new Promise((resolve) => setTimeout(resolve, 200));

					console.log('Test: Calling renderSequence()');
					const result = await renderSequence();
					console.log('Test: Render result:', result);

					if (result) {
						console.log('Test: Rendering successful!');
						// Save the result for potential reuse
						lastRenderResult = result;
					} else {
						console.error('Test: Rendering failed, no result returned');
					}

					return result;
				} catch (error) {
					console.error('Test: Error rendering sequence:', error);
					return null;
				}
			},

			// Test finding the BeatFrame element in the DOM
			testFindBeatFrameElement: () => {
				console.log('Test: Finding BeatFrame element in DOM');

				// Check the prop first
				console.log('Test: beatFrameElement prop:', props.beatFrameElement);

				// Try to find the BeatFrame element in the DOM
				const beatFrameElements = document.querySelectorAll('.beat-frame');
				console.log('Test: Found', beatFrameElements.length, '.beat-frame elements');

				if (beatFrameElements.length > 0) {
					console.log('Test: First .beat-frame element:', beatFrameElements[0]);
				}

				// Try to find the beat-frame-container
				const beatFrameContainers = document.querySelectorAll('.beat-frame-container');
				console.log('Test: Found', beatFrameContainers.length, '.beat-frame-container elements');

				if (beatFrameContainers.length > 0) {
					console.log('Test: First .beat-frame-container element:', beatFrameContainers[0]);
				}

				return {
					propElement: props.beatFrameElement,
					beatFrameElements: Array.from(beatFrameElements),
					beatFrameContainers: Array.from(beatFrameContainers)
				};
			},

			// Test sharing with image
			testShareWithImage: async () => {
				console.log('Test: Attempting to share with image');
				try {
					// Reset sharing state to ensure we can test
					isSharing = false;

					// Render the sequence
					const result = await renderSequence();
					if (!result) {
						console.error('Test: Failed to render sequence');
						return false;
					}

					// Save the result
					lastRenderResult = result;

					// Share with image
					const success = await shareSequenceWithImage(result, sequenceName, shareUrl);
					console.log('Test: Share with image result:', success);
					return success;
				} catch (error) {
					console.error('Test: Error sharing with image:', error);
					return false;
				} finally {
					isSharing = false;
				}
			},

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

			// Get current state
			getState: () => {
				return {
					isSharing,
					isDropdownOpen,
					sequenceName,
					shareUrl,
					hasLastRenderResult: !!lastRenderResult
				};
			}
		};

		console.log(
			'ShareButton: Test utilities initialized. Access via window.shareButtonTest in the console.'
		);
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
	.share-button {
		/* Base sizes for dynamic scaling */
		--base-size: 45px; /* Base size of the button (was 56px) */
		--base-icon-size: 19px; /* Base size of the icon (was 24px) */
		--base-margin: 10px; /* Base margin from corner */

		position: absolute;
		width: calc(var(--button-size-factor, 1) * var(--base-size)); /* Dynamic width */
		height: calc(var(--button-size-factor, 1) * var(--base-size)); /* Dynamic height */
		min-width: 38px; /* Minimum width (was 48px) */
		min-height: 38px; /* Minimum height (was 48px) */

		top: var(--button-top-position, 10px);
		right: var(--button-right-position, 10px);
		z-index: 40;

		background-color: var(--tkc-button-panel-background, #2a2a2e);
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
</style>
