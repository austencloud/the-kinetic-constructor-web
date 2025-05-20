<!-- src/lib/components/SequenceWorkbench/TestEditButton.svelte -->
<script lang="ts">
	import { editModeStore } from '$lib/state/stores/editModeStore';

	// Local state
	let isEditMode = $state(false);

	// Subscribe to the store
	$effect(() => {
		const unsubscribe = editModeStore.subscribe((state) => {
			isEditMode = state.isEditMode;
		});

		return unsubscribe;
	});

	function handleClick() {
		// Toggle edit mode
		editModeStore.toggleEditMode();
	}
</script>

<button class="test-edit-button" class:active={isEditMode} onclick={handleClick}>
	Edit Mode: {isEditMode ? 'ON' : 'OFF'}
</button>

<style>
	.test-edit-button {
		position: fixed;
		top: 10px;
		right: 10px;
		z-index: 9999;
		background-color: #ff5722;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 8px 16px;
		font-size: 16px;
		cursor: pointer;
	}

	.test-edit-button.active {
		background-color: #4caf50;
	}
</style>
