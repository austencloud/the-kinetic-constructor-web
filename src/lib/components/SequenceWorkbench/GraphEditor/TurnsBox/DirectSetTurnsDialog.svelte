<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/DirectSetTurnsDialog.svelte -->
<script lang="ts">
	import DirectSetTurnsButton from './DirectSetTurnsButton.svelte';
	import { onMount, createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';

	export let onSelectTurns: (value: string) => void;
	export let onClose: () => void;
	export let color: 'blue' | 'red';

	const TURNS_VALUES = ['fl', '0', '0.5', '1', '1.5', '2', '2.5', '3'];
	const COLORS = {
		blue: {
			primary: '#2E3192',
			light: 'rgba(46,49,146,0.4)',
			medium: 'rgba(46,49,146,0.8)'
		},
		red: {
			primary: '#ED1C24',
			light: 'rgba(237,28,36,0.4)',
			medium: 'rgba(237,28,36,0.8)'
		}
	};

	$: colorConfig = COLORS[color];
	$: dialogBackground = `linear-gradient(135deg, ${colorConfig.light}, ${colorConfig.medium}), #fff`;

	// Close on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Mount event listener and clean up
	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="dialog-container" transition:fly={{ y: 20, duration: 200 }}>
	<!-- Overlay for closing on outside click -->
	<div
		class="overlay"
		on:click|stopPropagation={onClose}
		on:keydown={(e) => e.key === 'Enter' && onClose()}
		aria-label="Close dialog"
		tabindex="0"
		role="button"
	></div>

	<!-- Dialog content -->
	<div
		class="dialog"
		style="
			border-color: {colorConfig.primary};
			background: {dialogBackground};
		"
	>
		{#each TURNS_VALUES as value}
			<DirectSetTurnsButton
				{value}
				borderColor={colorConfig.primary}
				onClick={() => onSelectTurns(value)}
			/>
		{/each}
	</div>
</div>

<style>
	.dialog-container {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.overlay {
		position: absolute;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.2);
		z-index: 0;
		cursor: pointer;
	}

	.dialog {
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 3%;
		border: 3px solid;
		border-radius: 5%;
		padding: 3%;
		z-index: 1;
		height: 80%;
		width: 80%;
		align-items: center;
		justify-content: space-evenly;
	}
</style>
