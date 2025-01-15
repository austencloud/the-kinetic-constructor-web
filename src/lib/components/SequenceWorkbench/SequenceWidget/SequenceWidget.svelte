<script>
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';
</script>

<div class="sequence-widget">
	<!-- Main Layout -->
	<div class="main-layout">
		<!-- VBox on the left -->
		<div class="left-vbox">
			<!-- Labels -->
			<div class="sequence-widget-labels">
				<CurrentWordLabel currentWord="Word:" />
				<DifficultyLabel difficultyLevel={3} />
			</div>
			<!-- Beat Frame Container -->
			<div class="beat-frame-container">
				<BeatFrame />
			</div>
			<div class="indicator-label">
				<IndicatorLabel />
			</div>
		</div>
		<!-- Button Panel on the right -->
		<SequenceWidgetButtonPanel />
	</div>
	<!-- Indicator Label -->
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
	}

	.indicator-label {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 10px;
		color: white;
	}
</style>
