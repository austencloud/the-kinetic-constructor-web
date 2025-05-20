<script lang="ts">
	import DirectionButton from './DirectionButton.svelte';
	import type { Direction } from '$lib/stores/sequence/turnsStore';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		color: string;
		headerText: string;
		direction: Direction;
		iconPaths: { clockwise: string; counterClockwise: string };
		onDirectionChanged: (direction: Direction) => void;
	}>();

	// Handle direction change
	function handleDirectionChange(newDirection: Direction) {
		// Call the callback prop
		if (props.onDirectionChanged) {
			props.onDirectionChanged(newDirection);
		}
	}
</script>

<div class="turns-box-header">
	<!-- Counter-clockwise button -->
	<DirectionButton
		direction="counterclockwise"
		active={props.direction === 'counterclockwise'}
		color={props.color}
		iconPath={props.iconPaths.counterClockwise}
		altText="Counter-clockwise rotation"
		onDirectionSelected={handleDirectionChange}
	/>

	<!-- Label -->
	<div class="header-label" style="color: {props.color};">{props.headerText}</div>

	<!-- Clockwise button -->
	<DirectionButton
		direction="clockwise"
		active={props.direction === 'clockwise'}
		color={props.color}
		iconPath={props.iconPaths.clockwise}
		altText="Clockwise rotation"
		onDirectionSelected={handleDirectionChange}
	/>
</div>

<style>
	/* Header styles */
	.turns-box-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem; /* Using relative units */
		border-bottom: 0.1875rem solid var(--color, #000); /* Using relative units */
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.15),
			rgba(255, 255, 255, 0.05)
		); /* Reintroduced gradient background */
		min-height: 3.5rem; /* Ensure minimum height to prevent overlap */
	}

	.header-label {
		font-size: clamp(1.25rem, 3.5vw, 1.5rem); /* Reduced font size to prevent overlap */
		font-weight: bold;
		transition: color 0.2s ease;
		text-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.3); /* Using relative units */
		letter-spacing: 0.03125rem; /* Using relative units */
		margin: 0 0.5rem; /* Add horizontal margin to prevent overlap */
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		.turns-box-header {
			padding: 0.625rem 0.75rem; /* Using relative units */
			flex-wrap: wrap; /* Allow wrapping if needed */
			justify-content: space-around; /* Better spacing when wrapped */
			min-height: 3.75rem; /* Using relative units */
			height: auto; /* Allow height to adjust to content */
		}

		/* Ensure the header label is always visible */
		.header-label {
			min-width: 2.5rem; /* Using relative units */
			text-align: center;
			max-width: 100%;
			overflow: hidden;
			text-overflow: ellipsis;
			font-size: clamp(1rem, 3vw, 1.25rem); /* Smaller font size on mobile */
		}
	}

	@media (max-width: 480px) {
		.header-label {
			font-size: clamp(0.875rem, 2.5vw, 1.125rem); /* Using relative units */
		}
	}

	@media (max-width: 360px) {
		.turns-box-header {
			padding: 0.375rem; /* Using relative units */
			min-height: 3rem; /* Ensure minimum height */
		}

		.header-label {
			font-size: 0.875rem; /* Fixed size for very small screens */
			margin: 0 0.25rem; /* Reduce margin */
		}
	}
</style>
