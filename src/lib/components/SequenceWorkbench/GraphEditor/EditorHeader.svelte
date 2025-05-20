<!-- src/lib/components/SequenceWorkbench/GraphEditor/EditorHeader.svelte -->
<script lang="ts">
	// Define props using Svelte 5 runes syntax
	const props = $props<{
		onExitClick: () => void;
	}>();
</script>

<div class="editor-header">
	<h2>Beat Editor</h2>
	<button class="exit-button" onclick={props.onExitClick} aria-label="Close editor">
		<i class="fa-solid fa-times"></i>
	</button>
</div>

<style>
	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 0.0625rem solid rgba(255, 255, 255, 0.15);
		background: transparent;
	}

	.editor-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.exit-button {
		background: transparent;
		border: none;
		color: var(--tkc-text-color, #f8f9fa);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.exit-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		transform: scale(1.1);
	}

	.exit-button:active {
		transform: scale(0.95);
	}

	@media (max-width: 768px) {
		.editor-header h2 {
			font-size: 1.25rem;
		}
	}

	@media (max-width: 480px) {
		.editor-header {
			padding: 0.75rem 1rem;
		}

		.editor-header h2 {
			font-size: 1.1rem;
		}
	}
</style>
