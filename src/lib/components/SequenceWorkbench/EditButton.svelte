<!-- src/lib/components/SequenceWorkbench/EditButton.svelte -->
<script lang="ts">
	import { editModeState } from '$lib/state/stores/editModeState.svelte';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer.svelte';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// Local state
	let buttonElement = $state<HTMLButtonElement | null>(null);

	// Derived state from edit mode store
	const isEditMode = $derived(editModeState.state.isEditMode);
	const isSelectionMode = $derived(editModeState.state.isSelectionMode);
	const showTooltip = $derived(editModeState.state.showTooltip);
	const tooltipPosition = $derived(editModeState.state.tooltipPosition);

	function handleClick(event: MouseEvent) {
		// Provide haptic feedback when toggling edit mode
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Set tooltip position if needed
		if (!isEditMode && sequenceContainer.state.selectedBeatIds.length === 0) {
			editModeState.setTooltipPosition({
				x: event.clientX,
				y: event.clientY
			});
		}

		// Toggle edit mode
		editModeState.toggleEditMode();
	}

	// Handle document click to exit selection mode if clicking outside
	function handleDocumentClick(event: MouseEvent) {
		if (isSelectionMode && buttonElement && !buttonElement.contains(event.target as Node)) {
			// Only exit if not clicking on a beat (which would be handled by the beat selection)
			if (!(event.target as HTMLElement).closest('.beat-cell')) {
				editModeState.exitSelectionMode();
			}
		}
	}

	onMount(() => {
		if (browser) {
			// Add document click listener
			document.addEventListener('click', handleDocumentClick);

			return () => {
				document.removeEventListener('click', handleDocumentClick);
			};
		}
	});
</script>

<div class="edit-button-container">
	<button
		class="edit-button"
		class:active={isEditMode}
		class:selection-mode={isSelectionMode}
		bind:this={buttonElement}
		onclick={handleClick}
		aria-label={isEditMode ? 'Return to build mode' : 'Edit selected beat'}
	>
		{#if isEditMode}
			<i class="fa-solid fa-wrench"></i>
		{:else}
			<i class="fa-solid fa-pencil"></i>
		{/if}
	</button>

	{#if showTooltip && tooltipPosition}
		<div class="tooltip" style="left: {tooltipPosition.x}px; top: {tooltipPosition.y - 40}px;">
			Select a beat to edit
		</div>
	{/if}
</div>

<style>
	.edit-button-container {
		position: absolute;
		/* Position to the right of the remove beat button */
		bottom: max(calc(var(--button-size-factor, 1) * 10px), var(--safe-inset-bottom, 0px));
		/* Position relative to the remove beat button */
		left: calc(
			var(--remove-beat-button-width, 180px) + (var(--button-size-factor, 1) * 20px) +
				max(calc(var(--button-size-factor, 1) * 10px), var(--safe-inset-left, 0px))
		);
		z-index: 9999;
	}

	.edit-button {
		/* Define base sizes for dynamic scaling */
		--base-size: 45px; /* Base size of the button */
		--base-icon-size: 19px; /* Base size of the icon */

		width: calc(var(--button-size-factor, 1) * var(--base-size));
		height: calc(var(--button-size-factor, 1) * var(--base-size));
		min-width: 38px;
		min-height: 38px;
		border-radius: 50%;
		background-color: var(--tkc-button-panel-background, #2a2a2e);
		color: var(--tkc-icon-color-edit, #ff5722);
		border: none;
		box-shadow:
			0 3px 6px rgba(0, 0, 0, 0.16),
			0 3px 6px rgba(0, 0, 0, 0.23);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: calc(var(--button-size-factor, 1) * var(--base-icon-size));
		transition: all 0.2s ease-out;
	}

	.edit-button.active {
		background-color: var(--tkc-icon-color-edit, #ff5722);
		color: white;
		transform: scale(1.1);
	}

	.edit-button.selection-mode {
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.4);
			transform: scale(1);
		}
		50% {
			box-shadow: 0 0 8px 0 rgba(255, 87, 34, 0.6);
			transform: scale(1.1);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.4);
			transform: scale(1);
		}
	}

	.edit-button:hover {
		background-color: var(--tkc-button-panel-background-hover, #3c3c41);
		transform: translateY(-2px) scale(1.05);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.26);
	}

	.edit-button.active:hover {
		background-color: var(--tkc-icon-color-edit-hover, #ff8c42);
	}

	.edit-button:active {
		transform: translateY(0px) scale(1);
		background-color: var(--tkc-button-panel-background-active, #1e1e21);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 1px 2px rgba(0, 0, 0, 0.24);
	}

	.edit-button.active:active {
		background-color: var(--tkc-icon-color-edit-active, #e85d04);
	}

	.tooltip {
		position: fixed;
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 14px;
		pointer-events: none;
		z-index: 10000;
		transform: translate(-50%, 0);
		white-space: nowrap;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		animation: fadeIn 0.2s ease-out;
	}

	.tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translate(-50%, -10px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.edit-button {
			--button-size-factor: 0.9;
		}
	}

	@media (max-width: 480px) {
		.edit-button {
			--button-size-factor: 0.8;
		}
	}
</style>
