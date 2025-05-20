<script lang="ts">
	import { fly } from 'svelte/transition';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { TURNS_VALUES } from '$lib/stores/sequence/turnsStore';
	import { browser } from '$app/environment';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		isOpen: boolean;
		color: string;
		onClose: () => void;
		onSelectTurns: (turns: string | number) => void;
	}>();

	// Handle dialog close
	function handleClose() {
		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Call the callback prop
		if (props.onClose) {
			props.onClose();
		}
	}

	// Handle turns selection
	function handleSelectTurns(value: string) {
		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Call the callback prop
		if (props.onSelectTurns) {
			props.onSelectTurns(value);
		}
	}

	// Calculate dialog background color
	const dialogBackground = `linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))`;
</script>

{#if props.isOpen}
	<div class="dialog-container" transition:fly={{ y: 20, duration: 200 }}>
		<!-- Overlay for closing on outside click -->
		<div
			class="overlay"
			onclick={handleClose}
			onkeydown={(e) => e.key === 'Enter' && handleClose()}
			aria-label="Close dialog"
			tabindex="0"
			role="button"
		></div>

		<!-- Dialog content -->
		<div
			class="dialog"
			style="
				border-color: {props.color};
				background: {dialogBackground};
			"
		>
			{#each TURNS_VALUES as value}
				<button
					class="direct-set-button"
					style="border-color: {props.color};"
					onclick={() => handleSelectTurns(value)}
					aria-label={`Set turns to ${value}`}
				>
					{value}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* Dialog styles */
	.dialog-container {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100; /* Ensure dialog is above all other elements */
		contain: layout paint; /* Improve performance */
	}

	.overlay {
		position: absolute;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.4); /* Darker overlay for better contrast */
		z-index: 0;
		cursor: pointer;
		backdrop-filter: blur(3px); /* Enhanced blur effect */
	}

	.dialog {
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 5%; /* Increased gap for better spacing */
		border: 0.1875rem solid; /* Using relative units */
		border-radius: 1rem; /* Using relative units */
		padding: 5%; /* Increased padding for better spacing */
		z-index: 1;
		height: auto; /* Allow height to adjust to content */
		max-height: 80%; /* Limit maximum height */
		width: 80%;
		max-width: 90vw; /* Prevent dialog from being too wide on mobile */
		align-items: center;
		justify-content: space-evenly;
		box-shadow:
			0 0.625rem 1.875rem rgba(0, 0, 0, 0.3),
			0 0.25rem 0.625rem rgba(0, 0, 0, 0.2); /* Using relative units */
		overflow: auto; /* Add scrolling if needed */
	}

	.direct-set-button {
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: white;
		cursor: pointer;
		font-weight: bold;
		width: 100%;
		transition:
			background-color 0.2s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
		aspect-ratio: 1 / 1;
		font-size: clamp(1.5em, 4vw, 2em); /* Responsive font size */
		border: 0.1875rem solid; /* Using relative units */
		/* Add subtle shadow for depth */
		box-shadow:
			0 0.1875rem 0.5rem rgba(0, 0, 0, 0.15),
			inset 0 0.0625rem 0.1875rem rgba(255, 255, 255, 0.8);
		min-height: 3.125rem; /* Using relative units */
		position: relative; /* For pseudo-element */
		overflow: hidden; /* Contain pseudo-element */
	}

	/* Add subtle gradient overlay */
	.direct-set-button::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3));
		border-radius: 50%;
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.direct-set-button:hover {
		transform: scale(1.05);
		background-color: #f8f8f8;
		box-shadow:
			0 0.25rem 0.75rem rgba(0, 0, 0, 0.25),
			inset 0 0.0625rem 0.1875rem rgba(255, 255, 255, 0.8);
	}

	.direct-set-button:hover::before {
		opacity: 0.9;
	}

	.direct-set-button:active {
		transform: scale(0.95);
		background-color: #f0f0f0;
		box-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.1);
		transform: translateY(0.0625rem) scale(0.98);
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		/* Adjust dialog for mobile */
		.dialog {
			grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile */
			width: 90%;
			max-width: 90vw;
			height: auto;
			max-height: 80vh;
			padding: 0.625rem; /* Using relative units */
			gap: 0.625rem; /* Using relative units */
		}
	}

	@media (max-width: 480px) {
		.dialog {
			padding: 0.5rem; /* Using relative units */
			grid-template-columns: repeat(2, 1fr); /* 2 columns on very small screens */
			gap: 0.375rem; /* Using relative units */
			max-height: 70vh; /* Limit maximum height */
		}

		.direct-set-button {
			min-height: 2.5rem; /* Using relative units */
			font-size: 1.125rem; /* Using relative units */
		}
	}

	@media (max-width: 360px) {
		.direct-set-button {
			min-width: 1.875rem; /* Using relative units */
			min-height: 1.875rem; /* Using relative units */
			font-size: 0.875rem; /* Using relative units */
			border-width: 0.0625rem; /* Thinner border */
			padding: 0.125rem; /* Reduce padding */
		}
	}
</style>
