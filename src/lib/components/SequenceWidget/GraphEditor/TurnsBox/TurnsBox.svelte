<script lang="ts">
	import TurnsBoxHeader from './TurnsBoxHeader/TurnsBoxHeader.svelte';
	import TurnsWidget from './TurnsWidget/TurnsWidget.svelte';
	import DirectSetTurnsDialog from './DirectSetTurnsDialog.svelte';
	import { writable } from 'svelte/store';

	export let color: 'blue' | 'red';

	let turns: string | number = 0;
	let isDialogOpen = false;
	const turnsStore = writable<string | number>(turns);

	const handleOpenDialog = () => {
		isDialogOpen = true;
	};

	const handleSelectTurns = (value: string) => {
		turns = value === 'fl' ? value : parseFloat(value);
		turnsStore.set(turns);
		isDialogOpen = false;
	};

	const handleCloseDialog = () => {
		isDialogOpen = false;
	};
</script>

<div
	class="turns-box"
	style="--box-color: {color === 'blue' ? '#2e3192' : '#ed1c24'}; --box-gradient: {color === 'blue'
		? 'linear-gradient(135deg, rgba(46, 49, 146, 0.1), rgba(46, 49, 146, 0.3))'
		: 'linear-gradient(135deg, rgba(237, 28, 36, 0.1), rgba(237, 28, 36, 0.3))'};"
>
	<TurnsBoxHeader {color} />
	<TurnsWidget {color} {turns} onOpenDialog={handleOpenDialog} />

	{#if isDialogOpen}
		<DirectSetTurnsDialog {color} onSelectTurns={handleSelectTurns} onClose={handleCloseDialog} />
	{/if}
</div>

<style>
	.turns-box {
		position: relative; /* Required for absolute positioning of the dialog */
		flex: 1;
		border: 4px solid var(--box-color);
		border-radius: 5px;
		display: flex;
		flex-direction: column;
		background: var(--box-gradient);
		align-self: stretch;
		height: 100%;
		min-width: 0;
	}
</style>
