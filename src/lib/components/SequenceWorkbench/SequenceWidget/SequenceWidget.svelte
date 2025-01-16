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
			<div class="sequence-widget-labels">
				<CurrentWordLabel currentWord="Word:" {width} />
				<DifficultyLabel difficultyLevel={3} {width} />
			</div>
			<div class="beat-frame-container">
				<BeatFrame />
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
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
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
		flex:7
	}

	.sequence-widget-labels {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 10px;
		color: white;
	}

	.beat-frame-container {
		flex: 10;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.indicator-label-container {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 10px;
		color: white;
		flex:1
	}
</style>
