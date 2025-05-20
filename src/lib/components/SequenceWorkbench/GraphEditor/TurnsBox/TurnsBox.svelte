<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsBox.svelte -->
<script lang="ts">
	import { turnsStore, blueTurns, redTurns, type Direction } from '$lib/stores/sequence/turnsStore';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// Import sub-components
	import TurnsHeader from './components/TurnsHeader.svelte';
	import TurnsControl from './components/TurnsControl.svelte';
	import TurnsDialog from './components/TurnsDialog.svelte';

	// Component props
	export let color: 'blue' | 'red';
	export let onTurnsChanged: (data: { color: 'blue' | 'red'; turns: any }) => void;
	export let onDirectionChanged: (data: { color: 'blue' | 'red'; direction: Direction }) => void;

	// Simple component state (UI only, not duplicating store data)
	let isDialogOpen = false;

	// Get derived state from stores
	$: turnsData = color === 'blue' ? $blueTurns : $redTurns;
	$: direction = turnsData.direction;
	$: turns = turnsData.turns;

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
	$: colorConfig = COLORS[color];

	// Icon paths
	const iconPaths = {
		clockwise: '/icons/clockwise.png',
		counterClockwise: '/icons/counter_clockwise.png'
	};

	// Event handlers
	function handleSetDirection(newDirection: Direction) {
		turnsStore.setDirection(color, newDirection);
		hapticFeedbackService.trigger('selection');
		if (onDirectionChanged) {
			onDirectionChanged({ color, direction: newDirection });
		}
	}

	function handleOpenDialog() {
		isDialogOpen = true;
		hapticFeedbackService.trigger('navigation');
	}

	function handleCloseDialog() {
		isDialogOpen = false;
		hapticFeedbackService.trigger('navigation');
	}

	function handleSelectTurns(value: string | number) {
		const newTurns = value === 'fl' ? 'fl' : parseFloat(String(value));
		turnsStore.setTurns(color, newTurns);
		isDialogOpen = false;
		hapticFeedbackService.trigger('selection');
		if (onTurnsChanged) {
			onTurnsChanged({ color, turns: newTurns });
		}
	}

	function handleIncrement() {
		turnsStore.incrementTurns(color);
		hapticFeedbackService.trigger('selection');
		if (onTurnsChanged) {
			onTurnsChanged({ color, turns: turnsData.turns });
		}
	}

	function handleDecrement() {
		turnsStore.decrementTurns(color);
		hapticFeedbackService.trigger('selection');
		if (onTurnsChanged) {
			onTurnsChanged({ color, turns: turnsData.turns });
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
	style="--box-color: {colorConfig.primary}; --box-gradient: {colorConfig.gradient};"
>
	<!-- Header with direction buttons -->
	<TurnsHeader
		color={colorConfig.primary}
		headerText={colorConfig.text}
		{direction}
		{iconPaths}
		onDirectionChanged={handleSetDirection}
	/>

	<!-- Turns widget -->
	<div class="turns-widget">
		<div class="turns-text-label">Turns</div>

		<TurnsControl
			{turns}
			color={colorConfig.primary}
			onIncrement={handleIncrement}
			onDecrement={handleDecrement}
			onOpenDialog={handleOpenDialog}
		/>

		<div class="motion-type-label">Pro</div>
	</div>

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
	}

	/* Turns widget styles */
	.turns-widget {
		display: flex;
		flex-direction: column;
		gap: clamp(0.625rem, 3vw, 1rem); /* Using relative units */
		padding: clamp(1rem, 4vw, 1.5rem); /* Using relative units */
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
			padding: clamp(0.75rem, 3vw, 1rem); /* Using relative units */
			gap: 0.5rem; /* Using relative units */
			overflow: hidden; /* Prevent overflow */
			height: auto; /* Allow height to adjust to content */
			min-height: 9.375rem; /* Using relative units */
			max-height: 18.75rem; /* Using relative units */
		}
	}

	@media (max-width: 480px) {
		.turns-widget {
			padding: 0.5rem; /* Reduce padding on very small screens */
			min-height: 8rem; /* Reduce minimum height */
		}
	}

	@media (max-width: 360px) {
		.turns-widget {
			padding: 0.375rem; /* Using relative units */
			min-height: 7rem; /* Reduce minimum height further */
		}

		.turns-text-label,
		.motion-type-label {
			font-size: 0.75rem; /* Fixed size for very small screens */
		}
	}
</style>
