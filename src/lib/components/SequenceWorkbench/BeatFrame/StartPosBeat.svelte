<!-- src/lib/components/SequenceWorkbench/BeatFrame/StartPosBeat.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Beat from './Beat.svelte';
	import type { BeatData } from './BeatData';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { pictographContainer } from '$lib/state/stores/pictograph/pictographContainer';
	import type { PictographData } from '$lib/types/PictographData';
	import StyledBorderOverlay from '$lib/components/Pictograph/components/BeatHoverEffect.svelte';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import AnimatedHighlight from './GoldSelectionBorder.svelte';
	import { createSafePictographCopy } from '$lib/utils/pictographUtils';

	// Props using Svelte 5 runes
	const props = $props<{
		beatData: BeatData;
		onClick: () => void;
	}>();

	// Local state
	let beatData = $state(props.beatData);
	let showBorder = $state(false);
	let pictographData = $state<PictographData>(defaultPictographData);
	let isSelected = $state(false);
	let bluePulseEffect = $state(false);
	let redPulseEffect = $state(false);

	// Update isSelected when the selection changes
	// Use a more reactive approach with a manual subscription for immediate updates
	$effect(() => {
		// Create a subscription to the sequenceContainer state
		const unsubscribe = sequenceContainer.subscribe((state) => {
			// Update the selection state immediately when it changes
			isSelected = state.selectedBeatIds.includes('start-position');
		});

		// Clean up the subscription when the component is destroyed or the effect is re-run
		return unsubscribe;
	});

	// Initialize pictographData from props
	$effect(() => {
		if (props.beatData && props.beatData.pictographData) {
			pictographData = safeCopyPictographData(props.beatData.pictographData);
		}
	});

	// Helper function to safely copy pictograph data without circular references
	// Also ensures the data is valid for a start position (start and end locations must be the same)
	function safeCopyPictographData(data: PictographData): PictographData {
		// First create a safe copy without circular references
		const safeCopy = createSafePictographCopy(data);

		if (!safeCopy) {
			console.error('Failed to create safe copy of pictograph data');
			return defaultPictographData;
		}

		// Mark as start position
		safeCopy.isStartPosition = true;

		// Ensure motion data is properly formatted for a start position
		if (safeCopy.redMotionData) {
			safeCopy.redMotionData.motionType = 'static'; // Force static for start position
			safeCopy.redMotionData.endLoc = safeCopy.redMotionData.startLoc; // Force end location to match start location
			safeCopy.redMotionData.endOri = safeCopy.redMotionData.startOri; // Force end orientation to match start orientation
			safeCopy.redMotionData.turns = 0; // Force no turns for start position
		}

		if (safeCopy.blueMotionData) {
			safeCopy.blueMotionData.motionType = 'static'; // Force static for start position
			safeCopy.blueMotionData.endLoc = safeCopy.blueMotionData.startLoc; // Force end location to match start location
			safeCopy.blueMotionData.endOri = safeCopy.blueMotionData.startOri; // Force end orientation to match start orientation
			safeCopy.blueMotionData.turns = 0; // Force no turns for start position
		}

		// Ensure these are null to prevent any circular references
		safeCopy.redMotion = null;
		safeCopy.blueMotion = null;
		safeCopy.motions = [];

		return safeCopy;
	}

	// Flag to prevent circular updates
	let isUpdatingFromStartPos = false;

	// Update pictographData when beatData changes, but only if not already updating from selectedStartPos
	$effect(() => {
		if (!isUpdatingFromStartPos && beatData && beatData.pictographData) {
			pictographData = safeCopyPictographData(beatData.pictographData);
		}
	});

	// Subscribe to the selectedStartPos store
	onMount(() => {
		const unsubscribe = selectedStartPos.subscribe((startPos) => {
			// Set flag to prevent circular updates
			isUpdatingFromStartPos = true;

			try {
				if (startPos) {
					// Create a safe copy to avoid reference issues
					const startPosCopy = safeCopyPictographData(startPos);

					// Update the local pictograph data
					pictographData = startPosCopy;

					// Also update the pictographContainer
					pictographContainer.setData(pictographData);

					// Save to localStorage directly to ensure it's available during hot reloads
					try {
						// Use the safe copy for localStorage
						localStorage.setItem('start_position', JSON.stringify(pictographData));
					} catch (error) {
						console.error('Failed to save start position to localStorage:', error);
					}

					// Update the beat data
					beatData = {
						...beatData,
						pictographData: startPosCopy,
						filled: true
					};
				} else {
					// If no start position is set, use default data
					pictographData = defaultPictographData;

					// Also update the pictographContainer
					pictographContainer.setData(defaultPictographData);

					// Update the beat data
					beatData = {
						...beatData,
						pictographData: defaultPictographData,
						filled: false
					};
				}
			} finally {
				// Reset flag after updates are complete
				isUpdatingFromStartPos = false;
			}
		});

		return () => unsubscribe();
	});

	// Throttle function to prevent excessive animations
	function throttle(callback: Function, delay: number) {
		let lastCall = 0;
		return function (...args: any[]) {
			const now = Date.now();
			if (now - lastCall >= delay) {
				lastCall = now;
				callback(...args);
			}
		};
	}

	// Listen for highlight events from the GraphEditor or beat selection
	onMount(() => {
		// Throttle the highlight handler to prevent excessive animations
		const handleBeatHighlight = throttle((event: CustomEvent) => {
			if (!isSelected) return;

			const { color } = event.detail;

			if (color === 'blue') {
				bluePulseEffect = false;
				// Use a single setTimeout to reduce timer overhead
				setTimeout(() => {
					bluePulseEffect = true;
					setTimeout(() => (bluePulseEffect = false), 500);
				}, 10);
			} else {
				redPulseEffect = false;
				setTimeout(() => {
					redPulseEffect = true;
					setTimeout(() => (redPulseEffect = false), 500);
				}, 10);
			}
		}, 100); // Throttle to max 10 updates per second

		// Listen for the custom event
		document.addEventListener('beat-highlight', handleBeatHighlight as EventListener);

		return () => {
			document.removeEventListener('beat-highlight', handleBeatHighlight as EventListener);
		};
	});

	// Listen for the custom event as an alternative way to receive updates
	onMount(() => {
		// Handler for start position selected event
		const handleStartPosSelectedEvent = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				// Set flag to prevent circular updates
				isUpdatingFromStartPos = true;

				try {
					// Create a safe copy to avoid reference issues
					const newStartPos = safeCopyPictographData(event.detail.startPosition);

					// Update the pictograph data
					pictographData = newStartPos;

					// Also update the pictographContainer
					pictographContainer.setData(pictographData);

					// Save to localStorage directly to ensure it's available during hot reloads
					try {
						localStorage.setItem('start_position', JSON.stringify(pictographData));
					} catch (error) {
						console.error('Failed to save start position to localStorage:', error);
					}

					// Update the beat data
					beatData = {
						...beatData,
						pictographData: newStartPos,
						filled: true
					};

					// Log for debugging
					console.log('StartPosBeat: Updated start position from event');
				} finally {
					// Reset flag after updates are complete
					isUpdatingFromStartPos = false;
				}
			}
		};

		// Handler for start position refresh event (used when first beat is removed)
		const handleStartPosRefreshEvent = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				// Set flag to prevent circular updates
				isUpdatingFromStartPos = true;

				try {
					// Create a safe copy to avoid reference issues
					const newStartPos = safeCopyPictographData(event.detail.startPosition);

					// Update the pictograph data
					pictographData = newStartPos;

					// Also update the pictographContainer
					pictographContainer.setData(pictographData);

					// Force the selectedStartPos store to update with a safe copy
					selectedStartPos.set(newStartPos);

					// Update the beat data
					beatData = {
						...beatData,
						pictographData: newStartPos,
						filled: true
					};

					// Log for debugging
					console.log('StartPosBeat: Refreshed start position after first beat removal');
				} finally {
					// Reset flag after updates are complete
					isUpdatingFromStartPos = false;
				}
			}
		};

		// Add event listeners
		document.addEventListener(
			'start-position-selected',
			handleStartPosSelectedEvent as EventListener
		);

		document.addEventListener(
			'start-position-refresh',
			handleStartPosRefreshEvent as EventListener
		);

		return () => {
			// Clean up event listeners
			document.removeEventListener(
				'start-position-selected',
				handleStartPosSelectedEvent as EventListener
			);

			document.removeEventListener(
				'start-position-refresh',
				handleStartPosRefreshEvent as EventListener
			);
		};
	});

	// Handle clicks at this level to prevent multiple event handlers
	function handleContainerClick(event: MouseEvent) {
		// Only handle clicks directly on the container, not on children
		if (event.target === event.currentTarget) {
			// Provide haptic feedback when selecting the start position beat
			if (typeof window !== 'undefined' && hapticFeedbackService.isAvailable()) {
				hapticFeedbackService.trigger('selection');
			}

			// Select the start position in the sequence container
			sequenceContainer.selectBeat('start-position');

			// Call the actual click handler
			props.onClick();

			// Log for debugging
			console.log('StartPosBeat: Selected start position');
		}
	}

	function handleMouseEnter() {
		// Only show hover border if not selected
		if (!isSelected) {
			showBorder = true;
		}
	}

	function handleMouseLeave() {
		showBorder = false;
	}
</script>

<button
	class="start-pos-beat"
	class:selected={isSelected}
	onclick={handleContainerClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	type="button"
>
	<div class="pictograph-wrapper">
		<Beat beat={beatData} onClick={props.onClick} isStartPosition={true} {isSelected} />
		<StyledBorderOverlay {pictographData} isEnabled={showBorder && !isSelected} />

		{#if isSelected}
			<!-- Only show one highlight at a time to reduce rendering load -->
			<AnimatedHighlight active={true} color="blue" pulseEffect={bluePulseEffect} />
			{#if pictographData?.redMotionData}
				<AnimatedHighlight active={true} color="red" pulseEffect={redPulseEffect} />
			{/if}
		{/if}
	</div>
</button>

<style>
	.start-pos-beat {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		background-color: transparent;
		border: none;
		padding: 0; /* Remove default button padding */
		margin: 0; /* Remove any margin */
		box-sizing: border-box; /* Ensure padding is included in width/height */
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease;
		/* Use hardware acceleration */
		transform: translateZ(0);
		will-change: transform, opacity;
	}

	/* Style for selected state - simplified to work with AnimatedHighlight */
	.start-pos-beat.selected {
		background-color: rgba(255, 204, 0, 0.05); /* Subtle background highlight */
		transition: all 0.18s ease; /* Ensure smooth transition */
		z-index: 25; /* Higher z-index for selected beats */
	}

	/* Add hover effect for all states */
	.start-pos-beat:hover {
		transform: scale(1.05) translateZ(0); /* Apply scale on hover only */
		z-index: 30; /* Higher z-index when hovered */
	}

	.pictograph-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		overflow: visible; /* Changed from hidden to visible to allow hover effects to overflow */
		transition: all 0.18s ease;
		transform: translateZ(0);
		will-change: transform;
		box-sizing: border-box;
		background-color: rgba(
			34,
			34,
			34,
			0.9
		); /* Add background color to ensure pictograph is visible when overflowing */
	}
</style>
