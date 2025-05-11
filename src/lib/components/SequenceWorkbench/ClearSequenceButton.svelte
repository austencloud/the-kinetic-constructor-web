<!-- src/lib/components/SequenceWorkbench/ClearSequenceButton.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		clearSequence: void;
	}>();

	function handleClick() {
		dispatch('clearSequence');
	}
</script>

<button
	class="clear-button ripple"
	on:click={handleClick}
	aria-label="Clear sequence"
	data-mdb-ripple="true"
	data-mdb-ripple-color="light"
	in:fly={{ x: -20, duration: 300, delay: 200 }}
>
	<div class="icon-wrapper">
		<i class="fa-solid fa-eraser"></i>
	</div>
</button>

<style>
	.clear-button {
		/* Define base sizes for dynamic scaling */
		--base-size: 45px; /* Base size of the button (was 56px) */
		--base-icon-size: 19px; /* Base size of the icon (was 24px) */
		--base-margin: 10px; /* Define base margin to match ToolsButton */

		position: absolute;
		bottom: calc(var(--button-size-factor, 1) * var(--base-margin)); /* Dynamic bottom margin */
		left: calc(var(--button-size-factor, 1) * var(--base-margin)); /* Dynamic left margin */
		width: calc(var(--button-size-factor, 1) * var(--base-size)); /* Dynamic width */
		height: calc(var(--button-size-factor, 1) * var(--base-size)); /* Dynamic height */
		min-width: 38px; /* Minimum width to match ToolsButton (was 48px) */
		min-height: 38px; /* Minimum height to match ToolsButton (was 48px) */
		background-color: var(--tkc-button-panel-background, #2a2a2e); /* Dark background */
		border-radius: 50%; /* Perfectly round */
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			transform 0.2s ease-out,
			background-color 0.2s ease-out,
			box-shadow 0.2s ease-out;
		z-index: 40; /* Ensure it's above most content but potentially below modals/side panels */
		box-shadow:
			0 3px 6px rgba(0, 0, 0, 0.16),
			0 3px 6px rgba(0, 0, 0, 0.23);
		border: none; /* Remove any default button border */
		padding: 0; /* Remove padding, icon centered by flex */
		color: var(--tkc-icon-color-orange, orange); /* Icon color */
		pointer-events: auto; /* Ensure it's clickable */
	}

	.clear-button:hover {
		background-color: var(
			--tkc-button-panel-background-hover,
			#3c3c41
		); /* Slightly lighter on hover */
		transform: translateY(-2px) scale(1.05);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.26);
	}

	.clear-button:active {
		transform: translateY(0px) scale(1); /* Click down effect */
		background-color: var(--tkc-button-panel-background-active, #1e1e21); /* Darker when pressed */
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 1px 2px rgba(0, 0, 0, 0.24);
	}

	.icon-wrapper {
		background: transparent; /* Ensure wrapper doesn't obscure button background */
		display: flex;
		align-items: center;
		justify-content: center;
		width: auto;
		height: auto;
		color: inherit; /* Inherit color from .clear-button (orange) */
	}

	.icon-wrapper i.fa-eraser {
		font-size: calc(var(--button-size-factor, 1) * var(--base-icon-size)); /* Dynamic icon size */
		/* Color is inherited from .clear-button via .icon-wrapper */
	}

	/* Ensure MDB ripple effect visually integrates or remove if problematic */
	/* The .ripple class and data-mdb-ripple attributes are for Material Design Bootstrap ripple */
	/* If the ripple effect looks odd with the new style, consider removing the class and attributes from the button. */
</style>
