<script lang="ts">
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { isMinTurns, isMaxTurns, type TurnsValue } from '$lib/stores/sequence/turnsStore';
	import { browser } from '$app/environment';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		turns: TurnsValue;
		color: string;
		onIncrement: () => void;
		onDecrement: () => void;
		onOpenDialog: () => void;
	}>();

	// Handle increment button click
	function handleIncrement() {
		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Call the callback prop
		if (props.onIncrement) {
			props.onIncrement();
		}
	}

	// Handle decrement button click
	function handleDecrement() {
		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Call the callback prop
		if (props.onDecrement) {
			props.onDecrement();
		}
	}

	// Handle turns label click to open dialog
	function handleOpenDialog() {
		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Call the callback prop
		if (props.onOpenDialog) {
			props.onOpenDialog();
		}
	}
</script>

<div class="turns-control-container">
	<!-- Horizontal layout: [minus] [turns value] [plus] -->

	<!-- Decrement button -->
	<button
		class="increment-button"
		style="--color: {props.color}"
		onclick={handleDecrement}
		aria-label="Decrease turns"
		disabled={isMinTurns(props.turns)}
	>
		<i class="fa-solid fa-minus"></i>
	</button>

	<!-- Turns label/button -->
	<button
		class="turns-label"
		style="--color: {props.color}"
		onclick={handleOpenDialog}
		aria-label="Set turns value"
	>
		<span class="turns-value">{props.turns}</span>
	</button>

	<!-- Increment button -->
	<button
		class="increment-button"
		style="--color: {props.color}"
		onclick={handleIncrement}
		aria-label="Increase turns"
		disabled={isMaxTurns(props.turns)}
	>
		<i class="fa-solid fa-plus"></i>
	</button>
</div>

<style>
	.turns-control-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin: 0.5rem 0; /* Using relative units */
		box-sizing: border-box; /* Ensure padding is included in width calculation */
	}

	.increment-button {
		width: clamp(2.25rem, 12vw, 3rem); /* Slightly smaller for better fit */
		height: clamp(2.25rem, 12vw, 3rem); /* Slightly smaller for better fit */
		background-color: white;
		color: var(--color); /* Use the color variable for the icon color */
		border: 0.1875rem solid var(--color); /* Using relative units */
		border-radius: 50%;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			background-color 0.15s ease,
			color 0.15s ease; /* Added color transition */
		/* Add subtle shadow for depth */
		box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.2); /* Using relative units */
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0; /* Remove default button padding */
		line-height: 1; /* Ensure proper vertical alignment of text */
		flex-shrink: 0; /* Prevent shrinking */
		z-index: 2; /* Ensure buttons are above other elements */
		font-size: 1rem; /* Base font size for icons */
	}

	.increment-button:hover:enabled {
		transform: scale(1.1);
		background-color: var(--color);
		color: white;
		box-shadow:
			0 0.25rem 0.5rem rgba(0, 0, 0, 0.3),
			inset 0 0.0625rem 0.1875rem rgba(255, 255, 255, 0.5);
	}

	.increment-button:active:enabled {
		transform: scale(0.95);
		background-color: var(--color);
		color: white;
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
			font-size: 0.875rem; /* Smaller font size on mobile */
			border-width: 0.125rem; /* Thinner border on mobile */
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
