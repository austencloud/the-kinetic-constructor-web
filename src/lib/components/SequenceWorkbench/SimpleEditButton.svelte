<!-- src/lib/components/SequenceWorkbench/SimpleEditButton.svelte -->
<script lang="ts">
	import { editModeState } from '$lib/state/stores/editModeState.svelte';

	// Derived state from edit mode store
	const isEditMode = $derived(editModeState.state.isEditMode);

	function handleClick() {
		// Toggle edit mode
		editModeState.toggleEditMode();
	}
</script>

<div class="edit-button-container">
	<button
		class="edit-button"
		class:active={isEditMode}
		onclick={handleClick}
		aria-label={isEditMode ? 'Exit edit mode' : 'Edit selected beat'}
	>
		<i class="fa-solid fa-pencil"></i>
	</button>
</div>

<style>
	.edit-button-container {
		position: fixed;
		bottom: 120px;
		right: 20px;
		z-index: 9999;
	}

	.edit-button {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background-color: #2a2a2e;
		color: #ff5722;
		border: none;
		box-shadow:
			0 3px 6px rgba(0, 0, 0, 0.16),
			0 3px 6px rgba(0, 0, 0, 0.23);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		transition: all 0.2s ease-out;
	}

	.edit-button.active {
		background-color: #ff5722;
		color: white;
		transform: scale(1.1);
	}

	.edit-button:hover {
		background-color: #3c3c41;
		transform: translateY(-2px) scale(1.05);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.26);
	}

	.edit-button.active:hover {
		background-color: #ff8c42;
	}
</style>
