<script lang="ts">
	import DirectSetTurnsDialog from '../DirectSetTurnsDialog.svelte';
	import { writable } from 'svelte/store';

	export let turns: string | number = 0;
	export let color = 'blue';

	let isDialogOpen = false;
	const turnsStore = writable(turns);

	// Subscribe to the turnsStore to update the turns variable
	turnsStore.subscribe(value => {
		turns = value;
	});

	const handleLabelClick = () => {
		isDialogOpen = true;
	};

	const handleSelectTurns = (value: string | number) => {
		const newTurns = value === 'fl' ? value : parseFloat(value.toString());
		turnsStore.set(newTurns);
		isDialogOpen = false;
	};
</script>

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
<style>
	.turns-label {
		color: black;
		font-weight: bold;
		font-size: 3.5em;
		display: flex;
		justify-content: center;
		cursor: pointer;
		border: 4px solid var(--color);
		background-color: white;
		width: 30%;
		border-radius: 50%;
		height: 100%;
		align-items: center;
		transition: transform 0.1s, background-color 0.2s;
	}

	.turns-label:hover {
		transform: scale(1.1);
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3),
		inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}

	.turns-label:active {
		transform: scale(0.9);
	}
</style>
