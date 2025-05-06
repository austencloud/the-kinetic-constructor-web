<!-- src/lib/components/SequenceWorkbench/ClearSequenceButton.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';

	const dispatch = createEventDispatcher<{
		clearSequence: void;
	}>();

	function handleClick() {
		dispatch('clearSequence');
	}
</script>

<button
	class="clear-button ripple"
	on:click={handleClick}
	aria-label="Clear sequence"
	data-mdb-ripple="true"
	data-mdb-ripple-color="light"
	in:fly={{ x: -20, duration: 300, delay: 200 }}
>
	<div class="icon-wrapper">
		<i class="fa-solid fa-eraser"></i>
	</div>
</button>

<style>
	.clear-button {
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

	.clear-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		background: #fff0f0;
	}

	.clear-button:active {
		transform: scale(0.98);
	}

	.icon-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #ff7b00, #ff9e00);
		color: white;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		.clear-button {
			padding: 8px;
		}
	}
</style>
