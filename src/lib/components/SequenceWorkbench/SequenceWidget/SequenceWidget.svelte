<script>
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';
	import { sampleBeats } from './BeatFrame/BeatFrameExampleData';
	// 2) Decide how many to show at once
</script>

<div class="sequence-widget">
	<div class="main-layout">
		<div class="left-vbox">
			<div class="sequence-widget-labels">
				<CurrentWordLabel currentWord="Word:" />
				<DifficultyLabel difficultyLevel={3} />
			</div>
			<div class="beat-frame-container">
				<BeatFrame />
			</div>
			<div class="indicator-label">
				<IndicatorLabel />
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
		flex: 16;
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

	.indicator-label {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 10px;
		color: white;
	}
</style>
