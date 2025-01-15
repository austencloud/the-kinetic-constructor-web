<script lang="ts">
	import DirectSetTurnsDialog from '../DirectSetTurnsDialog.svelte';
	import { writable } from 'svelte/store';

	export let turns: string | number = 0;
	export let color = 'blue';

	let isDialogOpen = false;
	const turnsStore = writable(turns);

	const handleLabelClick = () => {
		isDialogOpen = true;
	};

	const handleSelectTurns = (value: string | number) => {
		const newTurns = value === 'fl' ? value : parseFloat(value.toString());
		turnsStore.set(newTurns);
		isDialogOpen = false;
	};
</script>

<div>
	<button
		class="turns-label"
		style="--color: {color}"
		on:click={handleLabelClick}
		aria-label="Set turns"
	>
		{turns}
	</button>

	{#if isDialogOpen}
		<DirectSetTurnsDialog
			{color}
			onSelectTurns={handleSelectTurns}
			onClose={() => (isDialogOpen = false)}
		/>
	{/if}
</div>

<style>
	.turns-label {
		color: black;
		font-weight: bold;
		font-size: 3em;
		display: flex;
		justify-content: center;
		cursor: pointer;
		border: 3px solid var(--color);
		background-color: white;
		width: 100%;
}
</style>
