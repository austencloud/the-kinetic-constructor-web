<script lang="ts">
	import { untrack } from 'svelte';
	import { glyphContainer, type Rect } from '$lib/stores/glyphContainer.svelte';
	import type { Letter } from '$lib/types/Letter';

	// Props using Svelte 5 runes
	const {
		letter = null,
		onletterLoaded,
		onloadingStarted,
		onloadingComplete
	} = $props<{
		letter?: Letter | null;
		onletterLoaded?: (rect: Rect) => void;
		onloadingStarted?: () => void;
		onloadingComplete?: (success: boolean) => void;
	}>();

	// Local state using Svelte 5 runes with reactive loop prevention
	let svgPath = $state('');
	let dimensions = $state({ width: 0, height: 0 });
	let imageElement = $state<SVGImageElement | null>(null);
	let isLoaded = $state(false);
	let isFetchFailed = $state(false);
	let hasDispatchedLetterLoaded = $state(false);
	let isLoadingInProgress = $state(false);

	// CRITICAL FIX: Prevent infinite reactive loops
	let lastProcessedLetter = $state<Letter | null>(null);
	let isProcessingEffect = false;

	// Load SVG with proper caching strategy
	// This function is async, so it's called within an $effect
	async function loadLetterSVG(currentLetter: Letter) {
		// CRITICAL FIX: Prevent loading with undefined/null letters
		if (!currentLetter || currentLetter === undefined || currentLetter === null) {
			return;
		}

		// Signal that loading has started
		isLoadingInProgress = true;
		onloadingStarted?.();

		const path = glyphContainer.getLetterPath(currentLetter);
		svgPath = path; // Update state

		// Check cache first
		const cacheKey = currentLetter.toString();
		let cachedSVG = glyphContainer.cache.letters_trimmed.get(cacheKey);

		if (cachedSVG) {
			dimensions = cachedSVG.dimensions; // Update state
			isLoaded = true; // Update state
			isLoadingInProgress = false;
			onloadingComplete?.(true);
			return;
		}

		try {
			// Fetch dimensions if not in cache
			const fetchedDimensions = await glyphContainer.fetchSVGDimensions(path);
			dimensions = fetchedDimensions; // Update state

			// Update cache directly (no need for update function with runes)
			glyphContainer.cache.letters_trimmed.set(cacheKey, {
				svg: path, // svgPath is already set
				dimensions: fetchedDimensions
			});

			isLoaded = true; // Update state
			isLoadingInProgress = false;
			onloadingComplete?.(true);
		} catch (error) {
			console.error(`Failed to load letter SVG for ${currentLetter}:`, error);
			isFetchFailed = true; // Update state
			isLoadingInProgress = false;
			onloadingComplete?.(false);
		}
	}

	// CRITICAL FIX: React to letter changes with infinite loop prevention
	$effect(() => {
		// Prevent infinite loops by checking if we're already processing
		if (isProcessingEffect) {
			return;
		}

		// Check if the letter actually changed to prevent unnecessary processing
		if (letter === lastProcessedLetter) {
			return;
		}

		// Set processing flag to prevent re-entry
		isProcessingEffect = true;

		try {
			if (letter) {
				// Only process if letter is different from last processed
				lastProcessedLetter = letter;

				// Use untrack to prevent reactive loops when resetting state
				untrack(() => {
					isLoaded = false; // Reset loading state
					isFetchFailed = false; // Reset error state
					hasDispatchedLetterLoaded = false; // Reset dispatch state
				});

				// Load the SVG (this is async but doesn't trigger reactive updates)
				loadLetterSVG(letter);
			} else {
				// Handle null/undefined letter
				lastProcessedLetter = null;

				// Use untrack to prevent reactive loops when resetting state
				untrack(() => {
					svgPath = '';
					dimensions = { width: 0, height: 0 };
					isLoaded = false;
					isFetchFailed = false;
					hasDispatchedLetterLoaded = false;
				});
			}
		} finally {
			// Always reset the processing flag after a delay to prevent permanent blocking
			setTimeout(() => {
				isProcessingEffect = false;
			}, 10);
		}
	});

	// Handle image loaded with proper layout calculation
	function handleImageLoad() {
		// Prevent multiple dispatches for the same image load
		if (hasDispatchedLetterLoaded || !imageElement) return;

		try {
			const bbox = imageElement.getBBox();
			const rect: Rect = {
				left: bbox.x,
				top: bbox.y,
				width: bbox.width,
				height: bbox.height,
				right: bbox.x + bbox.width,
				bottom: bbox.y + bbox.height
			};

			// Set flag to prevent multiple dispatches
			hasDispatchedLetterLoaded = true; // Update state

			// Emit the event
			onletterLoaded?.(rect);
		} catch (error) {
			console.error('Error calculating letter bounding box:', error);
		}
	}
</script>

<g class="tka-letter">
	{#if svgPath && isLoaded && dimensions.width > 0}
		<image
			bind:this={imageElement}
			href={svgPath}
			width={dimensions.width}
			height={dimensions.height}
			preserveAspectRatio="xMinYMin meet"
			onload={handleImageLoad}
		/>
	{:else if isFetchFailed}
		<rect width="50" height="50" fill="rgba(255,0,0,0.2)" stroke="red" stroke-width="1" />
		<text x="10" y="30" fill="red" font-size="12">Error</text>
	{:else}
		<rect width="50" height="50" fill="rgba(200,200,200,0.3)" />
	{/if}
</g>
