<script lang="ts">
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import { onMount } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData.js';
	import LoadingSpinner from '$lib/components/MainWidget/loading/LoadingSpinner.svelte';
	// Import the modern runes-based sequence state
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	// Import the modern runes-based pictograph data
	import { pictographData } from '$lib/state/pictograph/pictographDataState.svelte';
	import { browser } from '$app/environment';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import LoadingOverlay from './LoadingOverlay.svelte';
	import { transitionLoadingState } from '$lib/state/simple/uiState.svelte';

	let gridMode = 'diamond';
	let startPositionPictographs = $state<PictographData[]>([]);
	let filteredDataAvailable = $state(false);
	let dataInitializationChecked = $state(false);
	let isLoading = $state(true);
	let loadingError = $state(false);
	let isTransitioning = $state(false); // Local state for the loading overlay

	// Subscribe to the global loading state using pure runes
	$effect(() => {
		isTransitioning = transitionLoadingState.isLoading;
	});

	let initialDataTimeout: number | null = null;

	// Modern runes-based reactive effect to watch pictograph data changes
	$effect(() => {
		if (!browser) return;

		const data = pictographData.data;
		const isInitialized = pictographData.isInitialized;
		const isPictographLoading = pictographData.isLoading;
		const pictographError = pictographData.error;

		if (pictographError) {
			console.error('StartPosPicker: Pictograph data error:', pictographError);
			loadingError = true;
			isLoading = false;
			return;
		}

		if (isInitialized && data && data.length > 0) {
			dataInitializationChecked = true;

			const defaultStartPosKeys =
				gridMode === 'diamond'
					? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
					: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

			const filteredPictographs = data.filter(
				(entry) =>
					entry.redMotionData &&
					entry.blueMotionData &&
					defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`)
			);

			startPositionPictographs = filteredPictographs;
			filteredDataAvailable = filteredPictographs.length > 0;

			isLoading = false;
			if (initialDataTimeout) clearTimeout(initialDataTimeout);
		} else if (dataInitializationChecked && !isPictographLoading) {
			// Only set empty state if we've checked and we're not loading
			startPositionPictographs = [];
			filteredDataAvailable = false;
			isLoading = false;
		}
	});

	function handleStartPosClick(event: CustomEvent) {
		if (event.detail?.immediate) {
			isLoading = true;
			dataInitializationChecked = false;
			loadingError = false;
		}
		hapticFeedbackService.trigger('selection');
	}

	onMount(() => {
		document.addEventListener('start-position-click', handleStartPosClick as EventListener);

		// Async initialization
		const initializePictographData = async () => {
			// Check if pictograph data is already initialized
			if (!pictographData.isInitialized && !pictographData.isLoading) {
				// Wait for pictograph data to be initialized
				const initialized = await pictographData.waitForInitialization(10000);
				if (!initialized) {
					console.error('StartPosPicker: Pictograph data initialization timeout');
					loadingError = true;
					isLoading = false;
				}
			}
		};

		// Start the async initialization
		initializePictographData();

		initialDataTimeout = window.setTimeout(() => {
			if (isLoading && !dataInitializationChecked) {
				console.warn('StartPosPicker: Data initialization timeout after 5 seconds');
				isLoading = false;
				loadingError = true;
			}
		}, 5000);

		return () => {
			document.removeEventListener('start-position-click', handleStartPosClick as EventListener);
			if (initialDataTimeout) {
				clearTimeout(initialDataTimeout);
			}
		};
	});

	function safeCopyPictographData(data: PictographData): PictographData {
		const safeCopy: PictographData = {
			letter: data.letter,
			startPos: data.startPos,
			endPos: data.endPos,
			timing: data.timing,
			direction: data.direction,
			gridMode: data.gridMode,
			grid: data.grid,

			redMotionData: data.redMotionData
				? {
						id: data.redMotionData.id,
						handRotDir: data.redMotionData.handRotDir,
						color: data.redMotionData.color,
						leadState: data.redMotionData.leadState,
						motionType: data.redMotionData.motionType,
						startLoc: data.redMotionData.startLoc,
						endLoc: data.redMotionData.endLoc,
						startOri: data.redMotionData.startOri,
						endOri: data.redMotionData.endOri,
						propRotDir: data.redMotionData.propRotDir,
						turns: data.redMotionData.turns,
						prefloatMotionType: data.redMotionData.prefloatMotionType,
						prefloatPropRotDir: data.redMotionData.prefloatPropRotDir
					}
				: null,

			blueMotionData: data.blueMotionData
				? {
						id: data.blueMotionData.id,
						handRotDir: data.blueMotionData.handRotDir,
						color: data.blueMotionData.color,
						leadState: data.blueMotionData.leadState,
						motionType: data.blueMotionData.motionType,
						startLoc: data.blueMotionData.startLoc,
						endLoc: data.blueMotionData.endLoc,
						startOri: data.blueMotionData.startOri,
						endOri: data.blueMotionData.endOri,
						propRotDir: data.blueMotionData.propRotDir,
						turns: data.blueMotionData.turns,
						prefloatMotionType: data.blueMotionData.prefloatMotionType,
						prefloatPropRotDir: data.blueMotionData.prefloatPropRotDir
					}
				: null,

			redPropData: null,
			bluePropData: null,
			redArrowData: null,
			blueArrowData: null,
			gridData: null,

			motions: [],
			redMotion: null,
			blueMotion: null,
			props: []
		};

		return safeCopy;
	}

	const handleSelect = async (startPosPictograph: PictographData) => {
		try {
			// Immediately show loading state
			isTransitioning = true;
			transitionLoadingState.setLoading(true);

			// Provide haptic feedback when selecting a start position
			if (browser) {
				hapticFeedbackService.trigger('selection');
			}

			// Create a safe copy of the start position data
			const startPosCopy = safeCopyPictographData(startPosPictograph);
			startPosCopy.isStartPosition = true;

			// Ensure motion data is set to static for start positions
			if (startPosCopy.redMotionData) {
				startPosCopy.redMotionData.motionType = 'static';
				startPosCopy.redMotionData.endLoc = startPosCopy.redMotionData.startLoc;
				startPosCopy.redMotionData.endOri = startPosCopy.redMotionData.startOri;
				startPosCopy.redMotionData.turns = 0;
			}

			if (startPosCopy.blueMotionData) {
				startPosCopy.blueMotionData.motionType = 'static';
				startPosCopy.blueMotionData.endLoc = startPosCopy.blueMotionData.startLoc;
				startPosCopy.blueMotionData.endOri = startPosCopy.blueMotionData.startOri;
				startPosCopy.blueMotionData.turns = 0;
			}

			// Use the modern sequence state to set the start position
			await sequenceState.setStartPosition(startPosCopy);

			if (browser) {
				// Dispatch event for backward compatibility with existing components
				const customEvent = new CustomEvent('start-position-selected', {
					detail: {
						startPosition: startPosCopy,
						isTransitioning: true
					},
					bubbles: true
				});

				document.dispatchEvent(customEvent);

				// Provide success haptic feedback when the start position is successfully set
				hapticFeedbackService.trigger('success');
			}
		} catch (error) {
			console.error('StartPosPicker: Error setting start position:', error);
			// Reset loading state on error
			isTransitioning = false;
			transitionLoadingState.setLoading(false);
		}
	};
</script>

<div class="start-pos-picker">
	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner size="large" />
			<p class="loading-text">Loading Start Positions...</p>
		</div>
	{:else if loadingError}
		<div class="error-container">
			<p>Unable to load start positions. Please try refreshing the page.</p>
			<button
				onclick={() => {
					if (browser) window.location.reload();
				}}>Refresh</button
			>
		</div>
	{:else if !filteredDataAvailable}
		<div class="error-container">
			<p>No valid start positions found for the current configuration.</p>
		</div>
	{:else}
		<div class="pictograph-row">
			{#each startPositionPictographs as pictograph (pictograph.letter + '_' + pictograph.startPos + '_' + pictograph.endPos)}
				<div
					class="pictograph-container"
					role="button"
					tabindex="0"
					onclick={() => {
						handleSelect(pictograph);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleSelect(pictograph);
						}
					}}
				>
					<Pictograph pictographData={pictograph} showLoadingIndicator={false} debug={true} />
				</div>
			{/each}
		</div>
	{/if}

	<!-- Loading overlay that appears during transition -->
	<LoadingOverlay visible={isTransitioning} message="Loading options..." transitionDuration={200} />
</div>

<style>
	.start-pos-picker {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		min-height: 300px;
		padding: 20px 0;
		position: relative; /* Required for absolute positioning of the loading overlay */
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		flex: 1;
	}

	.loading-text {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
		animation: pulse 1.5s infinite ease-in-out;
	}

	@keyframes pulse {
		0% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.6;
		}
	}

	.error-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		background-color: rgba(255, 220, 220, 0.7);
		padding: 20px;
		border-radius: 10px;
		flex: 1;
	}

	.pictograph-row {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		width: 90%;
		gap: 3%;
		margin: auto;
		flex: 0 0 auto;
		padding: 2rem 0;
	}

	.pictograph-container {
		width: 25%;
		aspect-ratio: 1 / 1;
		height: auto;
		position: relative;
		cursor: pointer;
		transition: transform 0.2s ease-in-out;
	}

	.pictograph-container:hover {
		transform: scale(1.05);
	}
</style>
