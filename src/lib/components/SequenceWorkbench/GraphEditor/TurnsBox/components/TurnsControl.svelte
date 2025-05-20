<script lang="ts">
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { isMinTurns, isMaxTurns, type TurnsValue } from '$lib/stores/sequence/turnsStore';

	// Props
	export let turns: TurnsValue;
	export let color: string;
	export let onIncrement: () => void;
	export let onDecrement: () => void;
	export let onOpenDialog: () => void;

	// Handle increment button click
	function handleIncrement() {
		// Provide haptic feedback
		hapticFeedbackService.trigger('selection');

		// Call the callback prop
		if (onIncrement) {
			onIncrement();
		}
	}

	// Handle decrement button click
	function handleDecrement() {
		// Provide haptic feedback
		hapticFeedbackService.trigger('selection');

		// Call the callback prop
		if (onDecrement) {
			onDecrement();
		}
	}

	// Handle turns label click to open dialog
	function handleOpenDialog() {
		// Provide haptic feedback
		hapticFeedbackService.trigger('selection');

		// Call the callback prop
		if (onOpenDialog) {
			onOpenDialog();
		}
	}
</script>

<div class="turns-control-container">
	<!-- Horizontal layout: [minus] [turns value] [plus] -->

	<!-- Decrement button -->
	<button
		class="increment-button"
		style="--color: {color}"
		on:click={handleDecrement}
		aria-label="Decrease turns"
		disabled={isMinTurns(turns)}
	>
		−
	</button>

	<!-- Turns label/button -->
	<button
		class="turns-label"
		style="--color: {color}"
		on:click={handleOpenDialog}
		aria-label="Set turns value"
	>
		<span class="turns-value">{turns}</span>
	</button>

	<!-- Increment button -->
	<button
		class="increment-button"
		style="--color: {color}"
		on:click={handleIncrement}
		aria-label="Increase turns"
		disabled={isMaxTurns(turns)}
	>
		+
	</button>
</div>

<style>
	.turns-control-container {
		display: flex;
		flex-direction: row; /* Changed from column to row */
		align-items: center;
		justify-content: space-between; /* Space items evenly */
		gap: 0.75rem; /* Using relative units */
		width: 100%;
		margin: 0.5rem 0; /* Using relative units */
		padding: 0 0.5rem; /* Add horizontal padding */
	}

	.increment-button {
		width: clamp(2.5rem, 15vw, 3.5rem); /* Using relative units */
		height: clamp(2.5rem, 15vw, 3.5rem); /* Using relative units */
		background-color: white;
		color: black;
		border: 0.1875rem solid var(--color); /* Using relative units */
		border-radius: 50%;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			background-color 0.15s ease; /* Faster transitions */
		font-size: clamp(1.25rem, 4vw, 1.75rem); /* Responsive font size with relative units */
		/* Add subtle shadow for depth */
		box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.2); /* Using relative units */
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0; /* Remove default button padding */
		line-height: 1; /* Ensure proper vertical alignment of text */
		flex-shrink: 0; /* Prevent shrinking */
		z-index: 2; /* Ensure buttons are above other elements */
	}

	.increment-button:hover:enabled {
		transform: scale(1.1);
		background-color: #f8f8f8;
		box-shadow:
			0 0.25rem 0.5rem rgba(0, 0, 0, 0.3),
			inset 0 0.0625rem 0.1875rem rgba(255, 255, 255, 0.5);
	}

	.increment-button:active:enabled {
		transform: scale(0.95);
		background-color: #f0f0f0;
		box-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.2);
	}

	.increment-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.turns-label {
		color: black;
		font-weight: bold;
		display: flex;
		justify-content: center;
		cursor: pointer;
		border: 0.25rem solid var(--color); /* Using relative units */
		background-color: white;
		border-radius: 50%;
		align-items: center;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			background-color 0.15s ease; /* Faster transitions */
		/* Add subtle shadow for depth */
		box-shadow: 0 0.1875rem 0.375rem rgba(0, 0, 0, 0.2); /* Using relative units */
		/* Fixed size with responsive constraints */
		width: clamp(5rem, 25vw, 7rem); /* Using relative units, slightly smaller */
		height: clamp(5rem, 25vw, 7rem); /* Using relative units, slightly smaller */
		padding: 0; /* Remove default button padding */
		flex: 1; /* Allow it to grow and take available space */
		max-width: 7rem; /* Limit maximum width */
		z-index: 1; /* Ensure proper stacking */
	}

	.turns-value {
		font-size: clamp(2rem, 5vw, 3rem); /* Responsive font size with relative units */
		/* Ensure text doesn't overflow */
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1; /* Ensure proper vertical alignment */
	}

	.turns-label:hover {
		transform: scale(1.05);
		background-color: #f8f8f8;
		box-shadow:
			0 0.25rem 0.5rem rgba(0, 0, 0, 0.3),
			inset 0 0.0625rem 0.1875rem rgba(255, 255, 255, 0.5);
	}

	.turns-label:active {
		transform: scale(0.95);
		background-color: #f0f0f0;
		box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.2);
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		.turns-control-container {
			gap: 0.5rem; /* Using relative units */
			height: auto; /* Allow height to adjust to content */
			padding: 0 0.25rem; /* Reduce horizontal padding */
		}

		.turns-label {
			width: clamp(4rem, 20vw, 5.5rem); /* Smaller on mobile */
			height: clamp(4rem, 20vw, 5.5rem); /* Smaller on mobile */
			border-width: 0.1875rem; /* Thinner border on mobile */
		}

		.turns-value {
			font-size: clamp(1.75rem, 4.5vw, 2.5rem); /* Smaller font size on mobile */
		}

		.increment-button {
			width: clamp(2.25rem, 12vw, 3rem); /* Smaller on mobile */
			height: clamp(2.25rem, 12vw, 3rem); /* Smaller on mobile */
			font-size: clamp(1rem, 3.5vw, 1.5rem); /* Smaller font size on mobile */
		}
	}

	@media (max-width: 480px) {
		.turns-label {
			width: clamp(3.5rem, 18vw, 4.5rem); /* Using relative units */
			height: clamp(3.5rem, 18vw, 4.5rem); /* Using relative units */
			border-width: 0.125rem; /* Using relative units */
			min-width: 3.5rem; /* Using relative units */
			min-height: 3.5rem; /* Using relative units */
		}

		.turns-value {
			font-size: clamp(1.5rem, 4vw, 2rem); /* Using relative units */
		}

		.increment-button {
			width: clamp(2rem, 10vw, 2.5rem); /* Using relative units */
			height: clamp(2rem, 10vw, 2.5rem); /* Using relative units */
			border-width: 0.125rem; /* Using relative units */
			min-width: 1.875rem; /* Using relative units */
			min-height: 1.875rem; /* Using relative units */
		}
	}

	@media (max-width: 360px) {
		.turns-label {
			width: clamp(3rem, 16vw, 4rem); /* Using relative units */
			height: clamp(3rem, 16vw, 4rem); /* Using relative units */
			border-width: 0.0625rem; /* Thinner border */
		}

		.increment-button {
			width: clamp(1.75rem, 9vw, 2.25rem); /* Using relative units */
			height: clamp(1.75rem, 9vw, 2.25rem); /* Using relative units */
		}

		.turns-control-container {
			gap: 0.125rem; /* Reduce gap further */
		}
	}
</style>
