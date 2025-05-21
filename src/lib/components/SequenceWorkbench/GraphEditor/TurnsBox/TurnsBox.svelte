<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsBox.svelte -->
<script lang="ts">
	import { turnsStore, blueTurns, redTurns, type Direction } from '$lib/stores/sequence/turnsStore';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { browser } from '$app/environment';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';

	// Import sub-components
	import TurnsHeader from './components/TurnsHeader.svelte';
	import TurnsControl from './components/TurnsControl.svelte';
	import TurnsDialog from './components/TurnsDialog.svelte';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		color: 'blue' | 'red';
		onTurnsChanged: (data: { color: 'blue' | 'red'; turns: any }) => void;
		onDirectionChanged: (data: { color: 'blue' | 'red'; direction: Direction }) => void;
		layoutMode?: 'full' | 'header-only' | 'controls-only'; // New prop for U-shaped layout
	}>();

	// Default layout mode is 'full'
	const layoutMode = $derived(props.layoutMode || 'full');

	// Component state
	let isDialogOpen = $state(false);

	// Get derived state from stores
	const turnsData = $derived(props.color === 'blue' ? $blueTurns : $redTurns);
	const direction = $derived(turnsData.direction);
	const turns = $derived(turnsData.turns);

	// Get the current motion type from the selected beat
	function getMotionType() {
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length === 0) return 'pro'; // Default to pro

		const beatId = selectedBeatIds[0];

		// Check if the start position is selected
		if (beatId === 'start-position') {
			// Try to get start position data from localStorage
			if (browser) {
				try {
					const startPosJson = localStorage.getItem('start_position');
					if (startPosJson) {
						const startPosData = JSON.parse(startPosJson);
						const motionData =
							props.color === 'blue' ? startPosData.blueMotionData : startPosData.redMotionData;
						return motionData?.motionType || 'pro';
					}
				} catch (error) {
					console.error('Error loading start position data:', error);
				}
			}
			return 'pro'; // Default to pro if no data found
		}

		// Handle regular beat selection
		const beat = sequenceContainer.state.beats.find((b: { id: string }) => b.id === beatId);
		if (beat) {
			const motionData = props.color === 'blue' ? beat.blueMotionData : beat.redMotionData;
			return motionData?.motionType || 'pro';
		}

		return 'pro'; // Default to pro if no beat found
	}

	// Color configurations
	const COLORS = {
		blue: {
			text: 'Left',
			primary: '#2E3192',
			light: 'rgba(46,49,146,0.4)',
			medium: 'rgba(46,49,146,0.8)',
			gradient: 'linear-gradient(135deg, rgba(46,49,146,0.1), rgba(46,49,146,0.8)), #fff'
		},
		red: {
			text: 'Right',
			primary: '#ED1C24',
			light: 'rgba(237,28,36,0.4)',
			medium: 'rgba(237,28,36,0.8)',
			gradient: 'linear-gradient(135deg, rgba(237,28,36,0.1), rgba(237,28,36,0.8)), #fff'
		}
	};

	// Computed values based on color
	const colorConfig = $derived(COLORS[props.color as keyof typeof COLORS]);

	// Icon paths
	const iconPaths = {
		clockwise: '/icons/clockwise.png',
		counterClockwise: '/icons/counter_clockwise.png'
	};

	// Event handlers
	function handleSetDirection(newDirection: Direction) {
		// Update the turnsStore
		turnsStore.setDirection(props.color, newDirection);

		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Call the callback prop to update the beat data
		if (props.onDirectionChanged) {
			props.onDirectionChanged({ color: props.color, direction: newDirection });
		}
	}

	function handleOpenDialog() {
		isDialogOpen = true;

		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('navigation');
		}
	}

	function handleCloseDialog() {
		isDialogOpen = false;

		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('navigation');
		}
	}

	function handleSelectTurns(value: string | number) {
		const newTurns = value === 'fl' ? 'fl' : parseFloat(String(value));
		turnsStore.setTurns(props.color, newTurns);
		isDialogOpen = false;

		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		if (props.onTurnsChanged) {
			props.onTurnsChanged({ color: props.color, turns: newTurns });
		}
	}

	function handleIncrement() {
		turnsStore.incrementTurns(props.color);

		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		if (props.onTurnsChanged) {
			props.onTurnsChanged({ color: props.color, turns: turnsData.turns });
		}
	}

	function handleDecrement() {
		turnsStore.decrementTurns(props.color);

		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		if (props.onTurnsChanged) {
			props.onTurnsChanged({ color: props.color, turns: turnsData.turns });
		}
	}

	// Close dialog on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isDialogOpen) {
			handleCloseDialog();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="turns-box"
	class:header-only={layoutMode === 'header-only'}
	class:controls-only={layoutMode === 'controls-only'}
	style="--box-color: {colorConfig.primary}; --box-gradient: {colorConfig.gradient};"
>
	<!-- Header with direction buttons - shown in full and header-only modes -->
	{#if layoutMode === 'full' || layoutMode === 'header-only'}
		<TurnsHeader
			color={colorConfig.primary}
			headerText={colorConfig.text}
			{direction}
			{iconPaths}
			onDirectionChanged={handleSetDirection}
		/>
	{/if}

	<!-- Turns widget - shown in full and controls-only modes -->
	{#if layoutMode === 'full' || layoutMode === 'controls-only'}
		<div class="turns-widget">
			<div class="turns-text-label">Turns</div>

			<TurnsControl
				{turns}
				color={colorConfig.primary}
				onIncrement={handleIncrement}
				onDecrement={handleDecrement}
				onOpenDialog={handleOpenDialog}
			/>

			{#if browser}
				{@const currentMotionType = getMotionType()}
				<div class="motion-type-label">
					{currentMotionType === 'pro' ? 'Pro' : currentMotionType === 'anti' ? 'Anti' : 'Static'}
				</div>
			{:else}
				<div class="motion-type-label">Pro</div>
			{/if}
		</div>
	{/if}

	<!-- Direct set dialog (appears when turns label is clicked) -->
	<TurnsDialog
		isOpen={isDialogOpen}
		color={colorConfig.primary}
		onClose={handleCloseDialog}
		onSelectTurns={handleSelectTurns}
	/>
</div>

<style>
	/* Box container */
	.turns-box {
		position: relative;
		flex: 1;
		border: 4px solid var(--box-color);
		display: flex;
		flex-direction: column;
		background: var(--box-gradient); /* Reintroduced gradient background */
		align-self: stretch;
		min-width: 0;
		max-width: 100%; /* Ensure it doesn't overflow its container */
		width: 100%; /* Take full width of parent */
		border-radius: 1rem; /* Using relative units */
		overflow: hidden; /* Ensure content doesn't overflow rounded corners */
		box-shadow:
			0 0.375rem 1rem rgba(0, 0, 0, 0.15),
			0 0.125rem 0.25rem rgba(0, 0, 0, 0.1),
			inset 0 0.0625rem 0.1875rem rgba(255, 255, 255, 0.2); /* Enhanced shadow with relative units */
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease; /* Smooth transitions */
		/* Ensure proper containment for mobile */
		contain: layout paint;
		/* Prevent content from spilling out */
		max-height: 100%;
		box-sizing: border-box; /* Ensure border is included in width/height calculations */
	}

	/* Special styles for header-only mode */
	.turns-box.header-only {
		min-height: auto;
		max-height: none;
		border-width: 3px;
	}

	/* Special styles for controls-only mode */
	.turns-box.controls-only {
		min-height: auto;
		border-width: 3px;
	}

	/* Turns widget styles */
	.turns-widget {
		display: flex;
		flex-direction: column;
		gap: clamp(0.625rem, 3vw, 1rem); /* Using relative units */
		flex: 1;
		justify-content: space-between; /* Distribute content evenly */
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.05),
			rgba(255, 255, 255, 0.15),
			rgba(255, 255, 255, 0.05)
		); /* Reintroduced subtle gradient background */
		min-height: 12rem; /* Ensure minimum height */
		max-height: 20rem; /* Limit maximum height */
		overflow: hidden; /* Prevent overflow */
		contain: layout paint; /* Ensure proper containment */
	}

	.turns-text-label {
		font-weight: bold;
		text-align: center;
		font-size: clamp(1rem, 2.5vw, 1.25rem); /* Responsive font size with relative units */
		position: relative;
		display: inline-block;
		margin: 0 auto 0.5rem; /* Add bottom margin */
		padding-bottom: 0.25rem; /* Using relative units */
		color: rgba(0, 0, 0, 0.8); /* Slightly darker for better contrast */
	}

	/* Add a modern underline effect */
	.turns-text-label::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 10%;
		right: 10%;
		height: 0.125rem; /* Using relative units */
		background: var(--color, #000);
		opacity: 0.7;
		border-radius: 0.125rem; /* Using relative units */
	}

	.motion-type-label {
		font-style: italic;
		text-align: center;
		color: black;
		font-size: clamp(1rem, 2.5vw, 1.25rem); /* Responsive font size with relative units */
		margin-top: 0.5rem; /* Using relative units */
		font-weight: 500; /* Slightly bolder for better readability */
		padding: 0.25rem 0; /* Add vertical padding */
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		.turns-widget {
			gap: 0.5rem; /* Using relative units */
			overflow: hidden; /* Prevent overflow */
			height: auto; /* Allow height to adjust to content */
			min-height: 9.375rem; /* Using relative units */
			max-height: 18.75rem; /* Using relative units */
		}
	}

	@media (max-width: 480px) {
		.turns-widget {
			min-height: 8rem; /* Reduce minimum height */
		}
	}

	@media (max-width: 360px) {
		.turns-widget {
			min-height: 7rem; /* Reduce minimum height further */
		}

		.turns-text-label,
		.motion-type-label {
			font-size: 0.75rem; /* Fixed size for very small screens */
		}
	}
</style>
