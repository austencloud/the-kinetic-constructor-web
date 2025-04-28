<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Pictograph from '../shared/Pictograph.svelte';

	export let pictographs: any[] = [];
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher<{
		select: any;
	}>();

	function handleSelect(pictograph: any) {
		if (!disabled) {
			dispatch('select', pictograph);
		}
	}
</script>

<div class="pictograph-answers">
	{#each pictographs as pictograph}
		<button
			class="pictograph-button"
			on:click={() => handleSelect(pictograph)}
			{disabled}
			aria-label="Pictograph answer option"
		>
			<Pictograph data={pictograph} size="medium" />
		</button>
	{/each}
</div>

<style>
	.pictograph-answers {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.pictograph-button {
		padding: 0.5rem;
		border-radius: 8px;
		border: 2px solid transparent;
		background-color: var(--color-surface-700, #2d2d2d);
		cursor: pointer;
		transition:
			transform 0.15s,
			border-color 0.15s;
	}

	.pictograph-button:hover:not(:disabled) {
		border-color: var(--color-primary, #3e63dd);
		transform: translateY(-3px);
	}

	.pictograph-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.pictograph-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
