<script>
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';
</script>


<div class="sequence-widget">
	<!-- Labels -->
	<div class="sequence-widget-labels">
		<IndicatorLabel />
		<CurrentWordLabel currentWord="Example Word" />
		<DifficultyLabel difficultyLevel={3} />
	</div>
	
	
	<!-- Main Content Area -->
	<div class="sequence-widget-main">
		<div class="scroll-area">
			<BeatFrame />
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

	.sequence-widget-labels {
		display: flex;
		justify-content: space-around;
		padding: 10px;
	}

	.sequence-widget-main {
		display: flex;
		flex-direction: row;
		flex: 1;
		height: 100%;
	}

	.scroll-area {
		flex: 10;
		flex-direction: row;
		border-radius: 5px;
	}
</style>
