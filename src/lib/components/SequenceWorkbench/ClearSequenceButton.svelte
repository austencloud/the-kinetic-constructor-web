<!-- src/lib/components/SequenceWorkbench/ClearSequenceButton.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';

	// Event dispatcher
	const dispatch = createEventDispatcher();

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
		/* Base sizes - increased for better touch targets */
		--base-size: 44px;
		--base-padding: 10px;
		--base-margin: 12px;
		--base-font-size: 16px;
		--base-icon-size: 28px;
		--base-icon-font-size: 14px;
		--base-border-radius: 8px;

		position: absolute;
		bottom: calc(var(--button-size-factor, 1) * var(--base-margin));
		right: calc(var(--button-size-factor, 1) * var(--base-margin));
		z-index: 10;
		background: white;
		border: none;
		border-radius: 10px; /* Slightly larger border radius */
		padding: calc(var(--button-size-factor, 1) * var(--base-padding));
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease-in-out;
		font-size: calc(var(--button-size-factor, 1) * var(--base-font-size));
		color: #333;
		font-weight: 500;
		pointer-events: auto;
		/* Ensure minimum size for small screens */
		min-width: 44px;
		min-height: 44px;
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
		width: calc(var(--button-size-factor, 1) * var(--base-icon-size));
		height: calc(var(--button-size-factor, 1) * var(--base-icon-size));
		font-size: calc(var(--button-size-factor, 1) * var(--base-icon-font-size));
		border-radius: calc(var(--button-size-factor, 1) * var(--base-border-radius));
		/* Ensure minimum size for small screens */
		min-width: 32px;
		min-height: 32px;
	}

	/* Responsive adjustments for small screens */
	@media (max-width: 480px) {
		.clear-button {
			/* Increase size on small screens for better touch targets */
			--base-margin: 10px;
			--base-padding: 10px;
			--base-icon-size: 32px;
			--base-icon-font-size: 16px;
		}
	}
</style>
