<script lang="ts">
	import type { Direction } from '$lib/stores/sequence/turnsStore';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { browser } from '$app/environment';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		direction: Direction;
		active: boolean;
		color: string;
		iconPath: string;
		altText: string;
		onDirectionSelected: (direction: Direction) => void;
	}>();

	// Handle button click
	function handleClick() {
		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Call the callback prop
		if (props.onDirectionSelected) {
			props.onDirectionSelected(props.direction);
		}
	}
</script>

<button
	class="direction-button"
	class:active={props.active}
	style="--color: {props.color};"
	onclick={handleClick}
	aria-label={props.altText}
	aria-pressed={props.active}
>
	<div class="direction-icon">
		<img class="icon" src={props.iconPath} alt={props.altText} />
	</div>
</button>

<style>
	.direction-button {
		width: clamp(3.5rem, 18vw, 4.5rem); /* Using relative units */
		height: clamp(3.5rem, 18vw, 4.5rem); /* Made square for better proportions */
		border: 0.125rem solid var(--color); /* Using relative units */
		border-radius: 0.75rem; /* Using relative units */
		background-color: white;
		cursor: pointer;
		display: flex;
		justify-content: center; /* Center icon horizontally */
		align-items: center; /* Center icon vertically */
		padding: 0.5rem; /* Using relative units */
		transition:
			background-color 0.2s ease,
			transform 0.15s ease-in-out,
			box-shadow 0.2s ease;
		box-shadow:
			0 0.125rem 0.5rem rgba(0, 0, 0, 0.15),
			inset 0 0.0625rem 0.1875rem rgba(255, 255, 255, 0.7); /* Using relative units */
		position: relative; /* For pseudo-elements */
		overflow: hidden; /* Contain pseudo-elements */
	}

	/* Add subtle gradient overlay */
	.direction-button::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3));
		border-radius: 0.625rem; /* Using relative units */
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.direction-button:hover {
		background-color: #f8f8f8;
		box-shadow:
			0 0.25rem 0.75rem rgba(0, 0, 0, 0.25),
			inset 0 0.0625rem 0.1875rem rgba(255, 255, 255, 0.8);
		transform: translateY(-0.125rem); /* Using relative units */
	}

	.direction-button:hover::before {
		opacity: 0.9;
	}

	.direction-button.active {
		background-color: var(--color);
		color: white;
		box-shadow:
			inset 0 0.125rem 0.375rem rgba(0, 0, 0, 0.3),
			inset 0 0.0625rem 0.125rem rgba(255, 255, 255, 0.2),
			0 0.125rem 0.25rem rgba(0, 0, 0, 0.2);
		transform: translateY(0.0625rem); /* Using relative units */
	}

	.direction-button.active::before {
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.1));
		opacity: 0.6;
	}

	.direction-icon {
		position: relative;
		width: 90%; /* Enlarged from 70% to 90% */
		height: 90%; /* Enlarged from 70% to 90% */
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1; /* Above the pseudo-element */
	}

	.icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 0.0625rem 0.125rem rgba(0, 0, 0, 0.3)); /* Using relative units */
	}

	/* Specific styling for active state icons */
	.direction-button.active .icon {
		filter: drop-shadow(0 0.0625rem 0.0625rem rgba(0, 0, 0, 0.5)) brightness(1.2);
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		.direction-button {
			width: clamp(3rem, 16vw, 4rem); /* Using relative units */
			height: clamp(3rem, 16vw, 4rem); /* Using relative units */
			min-width: 2.8125rem; /* Using relative units */
			min-height: 2.8125rem; /* Using relative units */
			overflow: hidden; /* Prevent overflow */
		}
	}

	@media (max-width: 480px) {
		.direction-button {
			border-width: 0.0625rem; /* Using relative units */
			width: clamp(2.5rem, 15vw, 3.5rem); /* Using relative units */
			height: clamp(2.5rem, 15vw, 3.5rem); /* Using relative units */
		}
	}

	@media (max-width: 360px) {
		.direction-button {
			width: clamp(2.25rem, 14vw, 3rem); /* Using relative units */
			height: clamp(2.25rem, 14vw, 3rem); /* Using relative units */
		}
	}
</style>
