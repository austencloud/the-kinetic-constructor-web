<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsBox.svelte -->
<script lang="ts">
	import TurnsBoxHeader from './TurnsBoxHeader/TurnsBoxHeader.svelte';
	import TurnsWidget from './TurnsWidget/TurnsWidget.svelte';
	import DirectSetTurnsDialog from './DirectSetTurnsDialog.svelte';
	import { turnsStore } from '$lib/stores/turnsStore';

	export let color: 'blue' | 'red';

	let isDialogOpen = false;

	// Define color constants
	const COLORS = {
		blue: {
			hex: '#2e3192',
			gradient: 'linear-gradient(135deg, rgba(46,49,146,0.1), rgba(46,49,146,0.8)), #fff'
		},
		red: {
			hex: '#ed1c24',
			gradient: 'linear-gradient(135deg, rgba(237,28,36,0.1), rgba(237,28,36,0.8)), #fff'
		}
	};

	// Reactive values based on color
	$: ({ hex, gradient } = COLORS[color]);

	function handleOpenDialog() {
		isDialogOpen = true;
	}

	function handleSelectTurns(value: string) {
		// Convert "fl" to special value or parse float
		const turns = value === 'fl' ? 'fl' : parseFloat(value);
		turnsStore.setTurns(color, turns);
		isDialogOpen = false;
	}

	function handleCloseDialog() {
		isDialogOpen = false;
	}
</script>

<div
	class="turns-box"
	style="--box-color: {hex}; --box-gradient: {gradient};"
>
	<TurnsBoxHeader {color} />
	<TurnsWidget {color} onOpenDialog={handleOpenDialog} />

	{#if isDialogOpen}
		<DirectSetTurnsDialog
			{color}
			onSelectTurns={handleSelectTurns}
			onClose={handleCloseDialog}
		/>
	{/if}
</div>

<style>
	.turns-box {
		position: relative;
		flex: 1;
		border: 4px solid var(--box-color);
		display: flex;
		flex-direction: column;
		background: var(--box-gradient);
		align-self: stretch;
		height: 100%;
		min-width: 0;
	}
</style>