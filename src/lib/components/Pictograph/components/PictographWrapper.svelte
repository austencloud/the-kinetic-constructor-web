<!--
  PictographWrapper Component

  This component provides the wrapper element for the pictograph.
-->
<script lang="ts">
	// NO STORES - RUNES ONLY!
	import type { PictographData } from '$lib/types/PictographData';
	import { getPictographElement, getPictographRole } from '../utils/PictographRenderUtils';
	import { handleClick } from '../handlers/PictographEventHandler';

	// MODERNIZED: Svelte 5 runes syntax with direct data prop - NO STORES!
	const {
		pictographData,
		onClick = undefined,
		state,
		children
	} = $props<{
		pictographData: PictographData;
		onClick?: (() => void) | undefined;
		state: string;
		children?: import('svelte').Snippet;
	}>();

	// Derived values
	const element = $derived(getPictographElement(onClick));
	const role = $derived(getPictographRole(onClick));

	// MODERNIZED: Get the letter directly from data - NO STORES!
	const letter = $derived(() => {
		return pictographData &&
			typeof pictographData === 'object' &&
			pictographData !== null &&
			'letter' in pictographData
			? pictographData.letter
			: null;
	});

	const ariaLabel = $derived(onClick ? `Pictograph for letter ${letter || 'unknown'}` : undefined);
	const dataLetter = $derived(letter || 'none');
	const buttonProps = $derived(onClick ? { type: 'button' } : {});

	// Handle click event
	function handleClickEvent() {
		handleClick(onClick);
	}
</script>

<!-- Use a button if onClick is provided, otherwise use a div -->
<svelte:element
	this={element}
	class="pictograph-wrapper"
	onclick={handleClickEvent}
	aria-label={ariaLabel}
	{role}
	data-state={state}
	data-letter={dataLetter}
	{...buttonProps}
>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>

<style>
	.pictograph-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		aspect-ratio: 1;
	}

	.pictograph-wrapper:hover {
		cursor: pointer;
	}

	.pictograph-wrapper:hover :global(.pictograph) {
		transform: scale(1.05);
		z-index: 4;
		border: 4px solid #48bb78;
		box-shadow:
			0 0 0 2px rgba(72, 187, 120, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.pictograph-wrapper:active :global(.pictograph) {
		transform: scale(1);
		transition-duration: 0.05s;
	}

	.pictograph-wrapper:focus-visible {
		outline: none;
	}

	.pictograph-wrapper:focus-visible :global(.pictograph) {
		outline: 3px solid #4299e1;
		outline-offset: 2px;
	}

	.pictograph-wrapper[data-state='error'] :global(.pictograph) {
		border-color: #fc8181;
		box-shadow: 0 0 0 1px #fc8181;
	}
</style>
