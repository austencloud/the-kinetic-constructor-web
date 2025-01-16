<script lang="ts">
	import { onMount } from 'svelte';
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';

	let width = 0;

	onMount(() => {
		const resizeObserver = new ResizeObserver(entries => {
			for (let entry of entries) {
				width = entry.contentRect.width;
			}
		});
		const element = document.querySelector('.sequence-widget');
		if (element) {
			resizeObserver.observe(element);
		}

		return () => resizeObserver.disconnect();
	});
</script>

<div class="sequence-widget">
	<div class="main-layout">
		<div class="left-vbox">
			<div class="sequence-widget-labels">
				<CurrentWordLabel currentWord="Word:" width={width} />
				<DifficultyLabel difficultyLevel={3} width={width} />
			</div>
			<div class="beat-frame-container">
				<BeatFrame />
			</div>
			<div class="indicator-label-container">
				<IndicatorLabel width={width} />
			</div>
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
	}

	.main-layout {
		display: flex;
		flex-direction: row;
		flex: 1;
		height: 100%;
	}

	.left-vbox {
		display: flex;
		flex-direction: column;
		flex: 9;
		height: 100%;
		min-height: 0;
	}

	.sequence-widget-labels {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 10px;
		color: white;
	}

	.beat-frame-container {
		flex: 1;
		min-height: 0; /* Also important */
		display: flex; /* So children can expand */
		flex-direction: column;
	}

	.indicator-label-container {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 10px;
		color: white;
	}
</style>
