<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';
	import { browser } from '$app/environment';

	let width = 0;
	let height = 0;
	let isPortrait = true;

	export let sequenceWorkbenchHeight: number;
	let sequenceWorkbenchElement: HTMLElement | null = null;

	// Dynamically update layout and dimensions
	function updateLayout() {
		if (!browser) return;
		width = window.innerWidth;
		height = window.innerHeight;
		isPortrait = height > width;

		// Update sequenceWorkbenchHeight dynamically
		if (sequenceWorkbenchElement) {
			sequenceWorkbenchHeight = sequenceWorkbenchElement.offsetHeight;
		}
	}

	onMount(() => {
		if (!browser) return;
		updateLayout();
		window.addEventListener('resize', updateLayout);

		return () => {
			window.removeEventListener('resize', updateLayout);
		};
	});
</script>

<div class="sequence-widget" bind:this={sequenceWorkbenchElement}>
	<div class="main-layout" class:portrait={isPortrait}>
		<div class="left-vbox">
			<div class="centered-group">
				<div class="sequence-widget-labels">
					<CurrentWordLabel currentWord="Word:" {width} />
					<DifficultyLabel difficultyLevel={3} {width} />
				</div>
				<div class="beat-frame-container">
					<BeatFrame />
				</div>
			</div>
			<div class="indicator-label-container">
				<IndicatorLabel {width} />
			</div>

			<!-- Button Panel in portrait mode -->
			{#if isPortrait}
				<SequenceWidgetButtonPanel {isPortrait} containerWidth={width} containerHeight={height} />
			{/if}
		</div>

		<!-- Button Panel in landscape mode -->
		{#if !isPortrait}
			<SequenceWidgetButtonPanel
				{isPortrait}
				containerWidth={width}
				containerHeight={sequenceWorkbenchHeight}
			/>
		{/if}
	</div>
</div>

<style>
	.sequence-widget {
		display: flex;
		flex-direction: column;
		height: 100%; /* Full height for the widget */
	}

	.main-layout {
		display: flex;
		flex-direction: row;
		height: 100%;
	}

	.main-layout.portrait {
		flex-direction: column;
	}

	.left-vbox {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		min-height: 0;
		flex: 14;
	}

	.centered-group {
		display: flex;
		flex-direction: column;
		align-items: center; /* Center horizontally */
		justify-content: center; /* Center vertically */
		height: 100%; /* Ensure it takes full height */
		width: 100%;
	}

	.beat-frame-container {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1; /* Allow it to grow and take available space */
		min-height: 0; /* Prevent collapsing */
		width: 100%;
	}

	.sequence-widget-labels {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px; /* Add spacing between the labels */
		color: white;
	}

	.indicator-label-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 10px;
		color: white;
		flex: 1;
	}
</style>
