<script lang="ts">
	import ActionButton from './ActionButton.svelte';
	import type { ButtonDefinition, ActionEventDetail, LayoutOrientation } from '../types';
	import { ANIMATION_DURATIONS } from '../utils/animations';

	// Props using Svelte 5 runes
	const {
		buttons,
		buttonSize,
		layout, // Receive layout from parent (ActionToolbar)
		onaction
	} = $props<{
		buttons: ButtonDefinition[];
		buttonSize: number;
		layout: LayoutOrientation;
		onaction?: (detail: ActionEventDetail) => void;
	}>();

	// Always visible now
	const isVisible = true;
	const isAnimatingOut = false;

	// Forward the click event
	function handleButtonClick(detail: ActionEventDetail) {
		onaction?.(detail);
	}

	// Calculate total animation time for the wrapper fade-out/in
	const wrapperTransitionDuration = `${(ANIMATION_DURATIONS.TOGGLE_OUT / 1000) * 0.8}s`;
</script>

<div
	class="buttons-wrapper"
	class:vertical={layout === 'vertical'}
	class:visible={isVisible || isAnimatingOut}
	class:animating-out={isAnimatingOut}
	style="--wrapper-transition-duration: {wrapperTransitionDuration}; --button-size: {buttonSize}px;"
	role="list"
	aria-hidden={!(isVisible || isAnimatingOut)}
>
	{#if (isVisible || isAnimatingOut) && buttons}
		{#each buttons as button, i (button.id)}
			<ActionButton
				{button}
				{buttonSize}
				index={i}
				{isAnimatingOut}
				{layout}
				onClick={handleButtonClick}
			/>
		{/each}
	{/if}
</div>

<style>
	.buttons-wrapper {
		display: flex;
		align-items: center; /* Center items along cross-axis */
		justify-content: center; /* Center items along main-axis */
		gap: 12px;
		padding: 8px;
		opacity: 1;
		pointer-events: auto;
		box-sizing: border-box;
		flex-shrink: 0; /* Prevent shrinking */
	}

	.buttons-wrapper.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.buttons-wrapper.animating-out {
		opacity: 1;
		pointer-events: none;
	}

	/* Layout direction */
	.buttons-wrapper.vertical {
		flex-direction: column;
		width: max-content; /* Fit width */
		min-width: 60px; /* Ensure minimum width */
		max-height: 100%;
		overflow-y: auto;
		justify-content: flex-start;
		flex-shrink: 0; /* Prevent shrinking */
	}

	.buttons-wrapper:not(.vertical) {
		flex-direction: row;
		height: max-content; /* Fit height */
		min-height: 60px; /* Ensure minimum height */
		width: 100%;
		flex-wrap: wrap; /* Allow wrapping on very small screens */
		justify-content: center; /* Center wrapped items */
		box-sizing: border-box;
	}

	/* Responsive behavior for very small screens */
	@media (max-width: 480px) {
		.buttons-wrapper:not(.vertical) {
			padding: 4px;
			gap: 8px;
		}
	}
</style>
