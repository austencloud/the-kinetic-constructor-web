<script lang="ts">
	import DirectionButton from './DirectionButton.svelte';
	import type { Direction } from '$lib/state/stores/turnsStore.svelte';

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
	<!-- Label on its own line at the top -->
	<div class="header-label-container">
		<div class="header-label" style="color: {props.color};">{props.headerText}</div>
	</div>

	<!-- Direction buttons on the next row -->
	<div class="direction-buttons-container">
		<!-- Counter-clockwise button -->
		<DirectionButton
			direction="counterclockwise"
			active={props.direction === 'counterclockwise'}
			color={props.color}
			iconPath={props.iconPaths.counterClockwise}
			altText="Counter-clockwise rotation"
			onDirectionSelected={handleDirectionChange}
		/>

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
</div>

<style>
	/* Header styles */
	.turns-box-header {
		display: flex;
		flex-direction: column;
		padding: 0.75rem 1rem; /* Using relative units */
		border-bottom: 0.1875rem solid var(--color, #000); /* Using relative units */
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.15),
			rgba(255, 255, 255, 0.05)
		); /* Reintroduced gradient background */
		min-height: 5rem; /* Increased minimum height for two rows */
	}

	.header-label-container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 0.5rem; /* Space between label and buttons */
		width: 100%;
	}

	.header-label {
		font-size: clamp(1.25rem, 3.5vw, 1.5rem); /* Responsive font size */
		font-weight: bold;
		transition: color 0.2s ease;
		text-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.3); /* Using relative units */
		letter-spacing: 0.03125rem; /* Using relative units */
		text-align: center;
	}

	.direction-buttons-container {
		display: flex;
		justify-content: space-around;
		align-items: center;
		width: 100%;
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		.turns-box-header {
			padding: 0.625rem 0.75rem; /* Using relative units */
			min-height: 4.5rem; /* Slightly reduced for mobile */
		}

		.header-label {
			font-size: clamp(1rem, 3vw, 1.25rem); /* Smaller font size on mobile */
			max-width: 100%;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.direction-buttons-container {
			gap: 0.5rem; /* Add some gap between buttons */
		}
	}

	@media (max-width: 480px) {
		.turns-box-header {
			padding: 0.5rem; /* Reduced padding */
			min-height: 4rem; /* Further reduced for small screens */
		}

		.header-label {
			font-size: clamp(0.875rem, 2.5vw, 1.125rem); /* Using relative units */
		}

		.header-label-container {
			margin-bottom: 0.375rem; /* Reduced spacing */
		}
	}

	@media (max-width: 360px) {
		.turns-box-header {
			padding: 0.375rem; /* Using relative units */
			min-height: 3.5rem; /* Ensure minimum height */
		}

		.header-label {
			font-size: 0.875rem; /* Fixed size for very small screens */
		}

		.header-label-container {
			margin-bottom: 0.25rem; /* Minimal spacing */
		}
	}
</style>
