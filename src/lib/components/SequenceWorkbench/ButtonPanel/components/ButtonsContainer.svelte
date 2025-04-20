<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ActionButton from './ActionButton.svelte';
	import type { ButtonDefinition, ActionEventDetail } from '../types';
	import { panelStore } from '../stores/panelStore';
	import { ANIMATION_DURATIONS } from '../utils/animations';

	// Props
	export let buttons: ButtonDefinition[];
	export let buttonSize: number;

	// Get relevant state from the store
	const { isVisible, isAnimatingOut, layout } = $panelStore; // Use $ syntax directly

	// Event dispatcher to forward action button clicks
	const dispatch = createEventDispatcher<{ action: ActionEventDetail }>();

	// Forward the click event from ActionButton
	function handleButtonClick(event: CustomEvent<ActionEventDetail>) {
		dispatch('action', event.detail);
	}

	// Calculate total animation time for the wrapper fade-out/in
	const wrapperTransitionDuration = `${ANIMATION_DURATIONS.TOGGLE_OUT / 1000 * 0.8}s`;

</script>

<div
	class="buttons-wrapper"
	class:vertical={layout === 'vertical'} 
	class:visible={isVisible || isAnimatingOut}
	class:animating-out={isAnimatingOut} 
	style="--wrapper-transition-duration: {wrapperTransitionDuration};"
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
				on:click={handleButtonClick}
			/>
		{/each}
	{/if}
</div>

<style>
	.buttons-wrapper {
		display: flex;
		align-items: center;
		gap: 8px; /* Spacing between buttons */
		padding: 8px; /* Padding inside the wrapper */
		transition: opacity var(--wrapper-transition-duration) ease-in-out;
		opacity: 0; /* Start hidden */
		pointer-events: none; /* Prevent interaction when hidden/fading */
	}

	.buttons-wrapper.visible {
		opacity: 1;
		pointer-events: auto; /* Allow interaction when visible */
	}

	/* When animating out, keep container visible while buttons fly out */
	.buttons-wrapper.animating-out {
	  opacity: 1;
	  pointer-events: none; /* Disable interaction immediately */
	}

	/* Layout direction */
	.buttons-wrapper.vertical {
		flex-direction: column;
	}
	.buttons-wrapper:not(.vertical) {
		flex-direction: row;
	}
</style>
