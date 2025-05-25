<script lang="ts">
	import Modal from './Modal.svelte';
	import { uiState } from '../../components/WriteTab/state/uiState.svelte';

	// Props using Svelte 5 runes
	const {
		isOpen = false,
		title = 'Confirm Action',
		message = 'Are you sure you want to proceed?',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		confirmButtonClass = 'danger',
		showDontAskOption = true,
		onconfirm,
		onclose
	} = $props<{
		isOpen?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		confirmButtonClass?: string;
		showDontAskOption?: boolean;
		onconfirm?: (event: { dontAskAgain: boolean }) => void;
		onclose?: () => void;
	}>();

	// State variables
	let dontAskAgain = $state(false);

	function handleConfirm() {
		if (dontAskAgain && showDontAskOption) {
			uiState.toggleConfirmDeletions(false);
		}

		// Call the onconfirm callback if provided
		onconfirm?.({ dontAskAgain });

		close();
	}

	function close() {
		// Reset the checkbox when closing
		dontAskAgain = false;

		// Call the onclose callback if provided
		onclose?.();
	}
</script>

<Modal {isOpen} {title} onClose={close}>
	{#snippet children()}
		<!-- Content goes in the default slot -->
		<div class="confirmation-content">
			<p>{message}</p>

			{#if showDontAskOption}
				<label class="dont-ask-option">
					<input type="checkbox" bind:checked={dontAskAgain} />
					<span>Don't ask me again</span>
				</label>
			{/if}
		</div>
	{/snippet}

	{#snippet footer()}
		<!-- Footer content goes in the named footer slot -->
		<div class="modal-footer-buttons">
			<button class="cancel-button" onclick={close}>
				{cancelText}
			</button>
			<button class="confirm-button {confirmButtonClass}" onclick={handleConfirm}>
				{confirmText}
			</button>
		</div>
	{/snippet}
</Modal>

<style>
	.confirmation-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	p {
		margin: 0;
		line-height: 1.5;
	}

	.dont-ask-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #999;
		cursor: pointer;
		user-select: none;
	}

	.dont-ask-option input[type='checkbox'] {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}

	.cancel-button,
	.confirm-button {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		border: none;
	}

	.cancel-button {
		background-color: #3a3a3a;
		color: #e0e0e0;
	}

	.cancel-button:hover {
		background-color: #4a4a4a;
	}

	.confirm-button {
		color: white;
	}

	.confirm-button.danger {
		background-color: #e74c3c;
	}

	.confirm-button.danger:hover {
		background-color: #c0392b;
	}

	.confirm-button.primary {
		background-color: #3498db;
	}

	.confirm-button.primary:hover {
		background-color: #2980b9;
	}

	.confirm-button.secondary {
		background-color: #2ecc71;
	}

	.confirm-button.secondary:hover {
		background-color: #27ae60;
	}
</style>
