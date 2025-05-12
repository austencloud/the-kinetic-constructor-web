<!-- src/lib/components/SequenceWorkbench/DeleteModal.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	// Props
	export let isOpen: boolean = false;
	export let hasSelectedBeat: boolean = false;

	// Get the DeleteButton position for animation origin
	// These will be set by the parent component
	export let buttonRect: DOMRect | null = null;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		clearSequence: void;
		removeBeat: void;
		enterDeletionMode: void;
		close: void;
	}>();

	// Handle clear sequence
	function handleClearSequence() {
		dispatch('clearSequence');
		close();
	}

	// Handle remove beat
	function handleRemoveBeat() {
		if (hasSelectedBeat) {
			dispatch('removeBeat');
			close();
		} else {
			// Enter deletion mode
			dispatch('enterDeletionMode');
			close();
		}
	}

	// Close the modal
	function close() {
		dispatch('close');
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		console.log('Backdrop clicked', event.target, event.currentTarget);
		if (event.target === event.currentTarget) {
			console.log('Closing modal from backdrop click');
			close();
		}
	}

	// Handle keydown
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}

	// Calculate popup position based on button position
	$: popupStyle = buttonRect
		? `--origin-left: ${buttonRect.left + buttonRect.width / 2}px; --origin-bottom: ${buttonRect.bottom}px;`
		: `--origin-left: 50px; --origin-bottom: calc(100vh - 50px);`; // Fallback position

	// Log the popup style for debugging
	$: if (isOpen) {
		console.log('Popup style:', popupStyle);
		console.log('Button rect:', buttonRect);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}


	<div
		class="popup-backdrop"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-popup-title"
		tabindex="-1"
		transition:fade={{ duration: 300 }}
	>
		<!-- Fixed position popup that doesn't rely on CSS variables -->
		<div class="popup-container" style={popupStyle} data-testid="delete-popup-container">
			<div class="popup-content">
				<div class="option-buttons">
					<button class="option-button remove-beat" on:click={handleRemoveBeat}>
						<div class="option-icon">
							<i class="fa-solid fa-trash"></i>
						</div>
						<div class="option-text">
							<span class="option-title">Remove Selected Beat</span>
							<span class="option-description">
								{hasSelectedBeat
									? 'Delete the currently selected beat'
									: 'Click a beat to delete it'}
							</span>
						</div>
					</button>

					<button class="option-button clear-sequence" on:click={handleClearSequence}>
						<div class="option-icon">
							<i class="fa-solid fa-eraser"></i>
						</div>
						<div class="option-text">
							<span class="option-title">Clear Entire Sequence</span>
							<span class="option-description">Remove all beats and reset start position</span>
						</div>
					</button>
				</div>

				<div class="popup-footer">
					<button class="cancel-button" on:click={close}>Cancel</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.popup-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.3);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 100;
		pointer-events: all; /* Changed from auto to all to ensure clicks are captured */
		cursor: default;
	}

	.popup-container {
		position: fixed; /* Changed from absolute to fixed for more reliable positioning */
		left: 50px; /* Fixed position for debugging */
		bottom: 100px; /* Fixed position for debugging */
		background-color: var(--tkc-button-panel-background, #2a2a2e);
		border-radius: 8px;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
		width: 260px;
		max-width: 90vw;
		max-height: calc(100vh - 100px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		z-index: 101; /* Ensure it's above the backdrop */
		border: 2px solid #ff5555; /* Make it more visible for debugging */
	}

	.popup-content {
		padding: 1rem;
		overflow-y: auto;
		color: #e0e0e0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.option-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background-color: rgba(255, 255, 255, 0.05);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		color: inherit;
	}

	.option-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px) scale(1.02);
		filter: brightness(1.1);
	}

	.option-button:active {
		transform: translateY(0) scale(0.98);
	}

	.option-button.remove-beat {
		border-left: 3px solid #ff9e00;
	}

	.option-button.clear-sequence {
		border-left: 3px solid #ff5555;
	}

	.option-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.1);
		flex-shrink: 0;
	}

	.option-button.remove-beat .option-icon {
		color: #ff9e00;
	}

	.option-button.clear-sequence .option-icon {
		color: #ff5555;
	}

	.option-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.option-title {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.option-description {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.popup-footer {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.cancel-button {
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		background-color: rgba(255, 255, 255, 0.1);
		color: #e0e0e0;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.85rem;
	}

	.cancel-button:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	/* Add a small arrow pointing down from the popup */
	.popup-container::after {
		content: '';
		position: absolute;
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%);
		border-width: 8px 8px 0;
		border-style: solid;
		border-color: var(--tkc-button-panel-background, #2a2a2e) transparent transparent transparent;
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.popup-container {
			width: 240px;
		}

		.option-icon {
			width: 32px;
			height: 32px;
		}

		.option-title {
			font-size: 0.9rem;
		}

		.option-description {
			font-size: 0.75rem;
		}
	}
</style>
