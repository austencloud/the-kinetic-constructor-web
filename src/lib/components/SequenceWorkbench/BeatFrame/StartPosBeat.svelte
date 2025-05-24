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
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';

	// Props using Svelte 5 runes
	const props = $props<{
		beatData: BeatData;
		onClick: () => void;
	}>();

	// Local state - create a copy of the props to avoid modifying readonly props
	let localBeatData = $state<BeatData>({ ...props.beatData });
	let showBorder = $state(false);
	let pictographData = $state<PictographData>(defaultPictographData);
	let isSelected = $state(false);
	let bluePulseEffect = $state(false);
	let redPulseEffect = $state(false);

	// Update local beat data when props change
	$effect(() => {
		localBeatData = { ...props.beatData };
	});

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

	// Update pictographData when localBeatData changes, but only if not already updating from selectedStartPos
	$effect(() => {
		if (!isUpdatingFromStartPos && localBeatData && localBeatData.pictographData) {
			pictographData = safeCopyPictographData(localBeatData.pictographData);
		}
	});

	// Note: Removed reactive effect watching sequenceState.startPosition to prevent infinite loops
	// The component now relies on event-based updates and legacy store subscriptions

	// Subscribe to the selectedStartPos store for backward compatibility
	onMount(() => {
		const unsubscribe = selectedStartPos.subscribe((startPos) => {
			// Only update if modern sequence state doesn't have a start position
			// This prevents conflicts between modern and legacy state
			if (!sequenceState.startPosition && !isUpdatingFromStartPos) {
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

						// Update the local beat data
						localBeatData = {
							...localBeatData,
							pictographData: startPosCopy,
							filled: true
						};
					}
				} finally {
					// Reset flag after updates are complete
					isUpdatingFromStartPos = false;
				}
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

			// Use requestAnimationFrame instead of setTimeout for better performance
			if (color === 'blue') {
				bluePulseEffect = false;
				// Use requestAnimationFrame for smoother animations
				requestAnimationFrame(() => {
					bluePulseEffect = true;
					// Still need setTimeout for the duration, but optimize it
					const timer = setTimeout(() => {
						bluePulseEffect = false;
						clearTimeout(timer); // Clean up the timer
					}, 500);
				});
			} else {
				redPulseEffect = false;
				requestAnimationFrame(() => {
					redPulseEffect = true;
					// Still need setTimeout for the duration, but optimize it
					const timer = setTimeout(() => {
						redPulseEffect = false;
						clearTimeout(timer); // Clean up the timer
					}, 500);
				});
			}
		}, 100); // Throttle to max 10 updates per second

		// Handler for beat data updates
		const handleBeatDataUpdated = throttle((event: CustomEvent) => {
			if (!isSelected) return;

			// Check if this is the start position being updated
			const { beatId } = event.detail;
			if (beatId !== 'start-position') return;

			// Set flag to prevent circular updates
			isUpdatingFromStartPos = true;

			try {
				// Force a re-render by creating a shallow copy
				localBeatData = { ...localBeatData };

				// Update the pictograph data if needed
				if (event.detail.property === 'turns' || event.detail.property === 'direction') {
					// Always force a complete redraw for turns and direction changes
					const { color, property, value } = event.detail;

					// Create a new copy of the pictograph data
					const updatedPictographData = { ...pictographData };

					// If changing direction, we may need to update the motion type
					if (property === 'direction') {
						// Convert from Direction to PropRotDir
						const propRotDir =
							value === 'clockwise' ? 'cw' : value === 'counterclockwise' ? 'ccw' : 'no_rot';

						// Update the appropriate motion data
						if (color === 'blue' && updatedPictographData.blueMotionData) {
							// Update motion type based on direction change
							if (
								updatedPictographData.blueMotionData.motionType === 'pro' ||
								updatedPictographData.blueMotionData.motionType === 'anti'
							) {
								// If changing from clockwise to counterclockwise or vice versa,
								// switch between pro and anti motion types
								if (updatedPictographData.blueMotionData.propRotDir !== propRotDir) {
									updatedPictographData.blueMotionData = {
										...updatedPictographData.blueMotionData,
										motionType:
											updatedPictographData.blueMotionData.motionType === 'pro' ? 'anti' : 'pro',
										[property]: value
									};
								} else {
									updatedPictographData.blueMotionData = {
										...updatedPictographData.blueMotionData,
										[property]: value
									};
								}
							} else {
								updatedPictographData.blueMotionData = {
									...updatedPictographData.blueMotionData,
									[property]: value
								};
							}
						} else if (color === 'red' && updatedPictographData.redMotionData) {
							// Update motion type based on direction change
							if (
								updatedPictographData.redMotionData.motionType === 'pro' ||
								updatedPictographData.redMotionData.motionType === 'anti'
							) {
								// If changing from clockwise to counterclockwise or vice versa,
								// switch between pro and anti motion types
								if (updatedPictographData.redMotionData.propRotDir !== propRotDir) {
									updatedPictographData.redMotionData = {
										...updatedPictographData.redMotionData,
										motionType:
											updatedPictographData.redMotionData.motionType === 'pro' ? 'anti' : 'pro',
										[property]: value
									};
								} else {
									updatedPictographData.redMotionData = {
										...updatedPictographData.redMotionData,
										[property]: value
									};
								}
							} else {
								updatedPictographData.redMotionData = {
									...updatedPictographData.redMotionData,
									[property]: value
								};
							}
						}
					} else {
						// For turns updates, just update the property
						if (color === 'blue' && updatedPictographData.blueMotionData) {
							updatedPictographData.blueMotionData = {
								...updatedPictographData.blueMotionData,
								[property]: value
							};
						} else if (color === 'red' && updatedPictographData.redMotionData) {
							updatedPictographData.redMotionData = {
								...updatedPictographData.redMotionData,
								[property]: value
							};
						}
					}

					// For turns changes, we need to be more efficient
					if (property === 'turns') {
						// Instead of setting arrow data to null, update only the necessary properties
						// This is more efficient than forcing a complete recreation
						if (color === 'blue' && updatedPictographData.blueArrowData) {
							// Update the turns value directly in the arrow data
							updatedPictographData.blueArrowData = {
								...updatedPictographData.blueArrowData,
								turns: value
							};
						} else if (color === 'red' && updatedPictographData.redArrowData) {
							// Update the turns value directly in the arrow data
							updatedPictographData.redArrowData = {
								...updatedPictographData.redArrowData,
								turns: value
							};
						}
					}

					// Update the pictograph data
					pictographData = updatedPictographData;

					// Use requestAnimationFrame to schedule the update for the next frame
					// This helps avoid blocking the main thread and reduces jank
					requestAnimationFrame(() => {
						pictographContainer.setData(updatedPictographData);
					});
				}

				// Also trigger the pulse effect for the updated prop
				const { color } = event.detail;
				handleBeatHighlight({ detail: { color } } as CustomEvent);
			} finally {
				// Reset flag after updates are complete
				isUpdatingFromStartPos = false;
			}
		}, 50); // Use a shorter throttle time for data updates

		// Listen for the custom events
		document.addEventListener('beat-highlight', handleBeatHighlight as EventListener);
		document.addEventListener('beat-data-updated', handleBeatDataUpdated as EventListener);

		return () => {
			document.removeEventListener('beat-highlight', handleBeatHighlight as EventListener);
			document.removeEventListener('beat-data-updated', handleBeatDataUpdated as EventListener);
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

					// Update the local beat data
					localBeatData = {
						...localBeatData,
						pictographData: newStartPos,
						filled: true
					};
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

					// Update the local beat data
					localBeatData = {
						...localBeatData,
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
		<Beat beat={localBeatData} onClick={props.onClick} isStartPosition={true} {isSelected} />
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
