<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/TabButton.svelte -->
<script lang="ts">
	// No need to import the type since we're using $props()
	import { formatTabName, formatShortTabName } from './tabLabelFormatter';

	// Props
	const props = $props();

	// Event handler
	function handleClick() {
		// Create a custom event that will bubble up to the parent component
		const customEvent = new CustomEvent('tabSelect', {
			detail: props.categoryKey,
			bubbles: true,
			composed: true // Allows the event to cross the shadow DOM boundary
		});

		// Dispatch the event from the button element
		const buttonElement = document.getElementById(`tab-${props.categoryKey}`);
		if (buttonElement) {
			buttonElement.dispatchEvent(customEvent);
		} else {
			// Fallback to document if button element is not found
			console.warn('Button element not found, using document for event dispatch');
			document.dispatchEvent(customEvent);
		}
	}
</script>

<button
	class="tab"
	class:active={props.isActive}
	class:first-tab={props.isFirstTab}
	class:last-tab={props.isLastTab}
	onclick={handleClick}
	role="tab"
	aria-selected={props.isActive}
	aria-controls={`options-panel-${props.categoryKey}`}
	id="tab-{props.categoryKey}"
	title={formatTabName(props.categoryKey)}
	style="--tab-flex-basis: {props.tabFlexBasis}"
>
	{props.useShortLabels ? formatShortTabName(props.categoryKey) : formatTabName(props.categoryKey)}
</button>

<style>
	.tab {
		background: transparent;
		border: none;
		padding: clamp(0.4rem, 0.8vw, 0.7rem) clamp(0.6rem, 1vw, 1.2rem);
		cursor: pointer;
		font-weight: 500;
		font-size: clamp(0.85rem, 1.5vw, 1.05rem);
		color: white;
		transition:
			background-color 0.15s ease,
			color 0.15s ease,
			padding 0.3s ease,
			font-size 0.3s ease,
			flex-basis 0.3s ease;
		white-space: nowrap;
		flex: 1 1 var(--tab-flex-basis, 0); /* Use flex to expand tabs evenly */
		border-radius: 8px;
		margin: 0 0 2px 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 36px; /* Ensure minimum touch target size */
		min-height: 36px; /* Ensure minimum touch target size */
		max-width: none; /* Allow tabs to grow */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Special styling for first and last tabs */
	.tab.first-tab {
		margin-left: 0;
	}

	.tab.last-tab {
		margin-right: 0;
	}

	.tab.active {
		background: #0f172a;
		color: #38bdf8;
		font-weight: 600;
		/* Replace box-shadow with border for better visibility and no overflow */
		border: 2px solid #38bdf8;
		/* Adjust padding to compensate for the border */
		padding: calc(clamp(0.4rem, 0.8vw, 0.7rem) - 2px) calc(clamp(0.6rem, 1vw, 1.2rem) - 2px);
		/* Add a subtle glow effect */
		box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
		position: relative; /* For z-index to work */
		z-index: 2; /* Ensure active tab appears above others */
	}

	.tab:hover:not(.active) {
		background: #172033;
		color: #cbd5e1;
	}

	.tab:focus-visible {
		outline: 2px solid #60a5fa;
		outline-offset: 1px;
		background-color: rgba(59, 130, 246, 0.1);
	}
</style>
