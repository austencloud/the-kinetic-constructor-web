<script lang="ts">
	import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import { writable } from 'svelte/store';

	export let labels = ['Indicator Label', 'Current Word', 'Difficulty'];

	// State for the sequence widget
	let beatCount = writable(16); // Default beat count
</script>

<div class="sequence-widget">
	<!-- Labels -->
	<div class="sequence-widget-labels">
		{#each labels as label}
			<div class="label">{label}</div>
		{/each}
	</div>

	<!-- Main Content Area -->
	<div class="sequence-widget-main">
		<div class="scroll-area">
			<BeatFrame bind:beatCount />
		</div>
		<SequenceWidgetButtonPanel />
	</div>
</div>

<style>
	.sequence-widget {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		color: white;
	}

	.sequence-widget-labels {
		display: flex;
		justify-content: space-around;
		padding: 10px;
	}

	.label {
		font-size: 1.2rem;
		text-align: center;
	}

	.sequence-widget-main {
		display: flex;
		flex-direction: row;
		flex: 1;
	}

	.scroll-area {
		flex: 10;
		overflow-y: auto;
		padding: 10px;
		border-radius: 5px;
	}
</style>
