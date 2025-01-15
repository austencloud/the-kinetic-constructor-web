<script lang="ts">
	import DirectSetTurnsButton from './DirectSetTurnsButton.svelte';

	export let onSelectTurns: (value: string) => void;
	export let onClose: () => void;
	export let color: string;

	const turnsValues = ['fl', '0', '0.5', '1', '1.5', '2', '2.5', '3'];
	const borderColor = color === 'blue' ? '#6a79d1' : '#f26d6d';
</script>

<button
	class="overlay"
	on:click={onClose}
	on:keydown={(e) => e.key === 'Enter' && onClose()}
	aria-label="Close dialog"
></button>
<div class="dialog" style="border-color: {borderColor}">
	{#each turnsValues as value}
		<DirectSetTurnsButton {value} {borderColor} size="60px" onClick={() => onSelectTurns(value)} />
	{/each}
</div>

<style>
	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.2);
		z-index: 0;
	}

	.dialog {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
		border: 3px solid;
		border-radius: 10px;
		padding: 15px;
		background-color: white;
		z-index: 1;
    height: 70%;
    width: 70%;
    align-items: center;
    justify-content: space-evenly;
	}
</style>
