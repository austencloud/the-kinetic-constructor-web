<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import type { PictographData } from '$lib/types/PictographData';

	export let pictographs: PictographData[] = [];
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();

	// Create a store for each pictograph
	const pictographStores = pictographs.map((p) =>
		writable<PictographData>(p || defaultPictographData)
	);

	// Update stores when pictographs change
	$: if (pictographs.length > 0) {
		pictographs.forEach((p, i) => {
			if (i < pictographStores.length) {
				pictographStores[i].set(p);
			} else {
				pictographStores.push(writable<PictographData>(p));
			}
		});
	}

	function handleSelect(pictograph: PictographData) {
		if (!disabled) {
			dispatch('select', pictograph);
		}
	}
</script>

<div class="pictograph-answers">
	{#each pictographs as pictograph, i}
		<button
			class="pictograph-button"
			on:click={() => handleSelect(pictograph)}
			{disabled}
			aria-label="Pictograph answer option"
		>
			<div class="pictograph-container">
				<Pictograph pictographDataStore={pictographStores[i]} showLoadingIndicator={false} />
			</div>
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

	.pictograph-container {
		width: 120px;
		height: 120px;
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
