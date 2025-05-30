<script lang="ts">
	import { getContext, untrack } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerState } from '../optionPickerState.svelte';
	import { LAYOUT_CONTEXT_KEY } from '../layoutContext';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import StyledBorderOverlay from '$lib/components/Pictograph/components/BeatHoverEffect.svelte';

	// Props using Svelte 5 runes
	const props = $props<{
		pictographData: PictographData;
		isPartOfTwoItems?: boolean;
		onoptionselect?: (option: PictographData) => void;
	}>();

	// Default values for optional props
	const isPartOfTwoItems = $derived(props.isPartOfTwoItems ?? false);

	// Consume context - now using the getter function approach for Svelte 5 runes
	const getLayoutContext = getContext<() => any>(LAYOUT_CONTEXT_KEY);

	// Reactive state using Svelte 5 runes - call the getter function to access current values
	const isMobileDevice = $derived(getLayoutContext?.()?.isMobile ?? false);
	const scaleFactor = $derived(getLayoutContext?.()?.layoutConfig?.scaleFactor ?? 1);

	// Use untrack to prevent circular dependencies with the container
	const isSelected = $derived.by(() => {
		return untrack(() => {
			// For now, we don't track selected pictographs in the new system
			// This can be added later if needed
			return false;
		});
	});

	const ariaLabel = $derived(`Select option ${props.pictographData.letter || 'Unnamed'}`);

	// Create a stable copy of the pictograph data using $derived
	const stablePictographData = $derived(props.pictographData);

	// Show border state
	let showBorder = $state(false);

	function handleSelect() {
		// Call the callback if provided (new Svelte 5 approach)
		if (props.onoptionselect) {
			props.onoptionselect(props.pictographData);
		} else {
			// Fallback to the modern option picker state
			optionPickerState.selectOption(props.pictographData);
		}
	}

	function handleMouseEnter() {
		showBorder = true;
	}

	function handleMouseLeave() {
		showBorder = false;
	}
</script>

<div
	class="option"
	class:mobile={isMobileDevice}
	class:selected={isSelected}
	class:two-item-option={isPartOfTwoItems}
	class:hovered={showBorder}
	role="button"
	tabindex="0"
	onclick={handleSelect}
	onkeydown={(e) => e.key === 'Enter' && handleSelect()}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	aria-label={ariaLabel}
	aria-pressed={isSelected}
>
	<div class="pictograph-container" style="transform: scale({scaleFactor})">
		<!-- Optimized pictograph rendering with stable data -->
		<div class="pictograph-wrapper">
			{#if stablePictographData}
				<Pictograph
					pictographData={stablePictographData}
					disableAnimations={true}
					showLoadingIndicator={false}
				/>
				<StyledBorderOverlay
					pictographData={stablePictographData}
					isEnabled={showBorder || isSelected}
					isGold={isSelected}
				/>
			{/if}
		</div>
	</div>
</div>

<style>
	.option {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		transition:
			transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
			background-color 0.3s ease;
		border-radius: 6px;
		outline: none;
	}
	.pictograph-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
	}
	.pictograph-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	/* In Option.svelte - Use JavaScript state instead of CSS :hover to prevent infinite loops */
	.option.hovered {
		transform: scale(1.05); /* Reduced from 1.1 to make it less bouncy */
		background-color: rgba(243, 244, 246, 0.5);
		z-index: 20; /* Add this to ensure it rises above siblings */
	}
	.option:active {
		transform: scale(0.98);
	}
	.option.selected {
		background-color: rgba(56, 161, 105, 0.1);
	}
	.option.two-item-option {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	.option.two-item-option.hovered {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
	.option.mobile {
		transition: transform 0.15s ease-in-out;
	}
	.option.mobile.hovered {
		transform: scale(1.03);
	}
	.option:focus-visible {
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6);
		z-index: 11;
	}
</style>
