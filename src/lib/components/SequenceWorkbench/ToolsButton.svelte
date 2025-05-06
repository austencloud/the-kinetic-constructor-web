<!-- src/lib/components/SequenceWorkbench/ToolsButton.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';

	// Props
	export let isToolsPanelOpen = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		toggleToolsPanel: void;
	}>();

	// Handle click event
	function handleClick() {
		dispatch('toggleToolsPanel');
	}
</script>

<button
	class="tools-button ripple"
	on:click={handleClick}
	aria-label={isToolsPanelOpen ? 'Close Tools Panel' : 'Open Tools Panel'}
	aria-expanded={isToolsPanelOpen}
	data-mdb-ripple="true"
	data-mdb-ripple-color="light"
	in:fly={{ x: 20, duration: 300, delay: 200 }}
>
	<div class="icon-wrapper">
		<i class="fa-solid fa-screwdriver-wrench"></i>
	</div>
</button>

<style>
	.tools-button {
		position: absolute;
		bottom: 10px;
		right: 10px;
		z-index: 10;
		background: white;
		border: none;
		border-radius: 8px;
		padding: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease-in-out;
		font-size: 14px;
		color: #333;
		font-weight: 500;
		pointer-events: auto;
	}

	.tools-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		background: #f8f9fa;
	}

	.tools-button:active {
		transform: scale(0.98);
	}

	.icon-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #6a11cb, #2575fc);
		color: white;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		.tools-button {
			padding: 8px;
		}
	}
</style>
