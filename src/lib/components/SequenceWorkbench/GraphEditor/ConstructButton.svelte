<!-- src/lib/components/SequenceWorkbench/GraphEditor/ConstructButton.svelte -->
<script lang="ts">
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { browser } from '$app/environment';
	import { workbenchStore } from '$lib/state/stores/workbenchStore';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		onClick?: () => void;
	}>();

	// Handle click event
	function handleClick() {
		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('navigation');
		}

		// Clear selection in the sequence container
		sequenceContainer.clearSelection();

		// Switch to construct tab
		workbenchStore.update((state) => ({ ...state, activeTab: 'construct' }));

		// Call the onClick callback if provided
		if (props.onClick) {
			props.onClick();
		}

		// Log for debugging
		console.log('ConstructButton: Returning to construct mode');
	}
</script>

<button class="construct-button" onclick={handleClick} aria-label="Return to construct mode">
	<i class="fa-solid fa-hammer"></i>
	<span class="button-text">Construct</span>
</button>

<style>
	.construct-button {
		position: absolute;
		top: 12px;
		left: 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		background-color: var(--color-primary, #4361ee);
		color: white;
		border: none;
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		z-index: 10;
	}

	.construct-button:hover {
		background-color: var(--color-primary-dark, #3a56d4);
		transform: translateY(-1px);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
	}

	.construct-button:active {
		transform: translateY(1px);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.button-text {
		display: inline-block;
	}

	@media (max-width: 480px) {
		.button-text {
			display: none;
		}

		.construct-button {
			padding: 8px;
		}
	}
</style>
