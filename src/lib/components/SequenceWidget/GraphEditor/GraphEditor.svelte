<script lang="ts">
	import GraphEditorPictographContainer from './GraphEditorPictographContainer.svelte';
	import TurnsBox from './TurnsBox/TurnsBox.svelte';

	export let isExpanded: boolean;
	export let animationDuration: number;

	const maxEditorHeight = 300;
</script>

<div
	class="graph-editor"
	style="--animation-duration: {animationDuration}ms; height: {isExpanded
		? maxEditorHeight + 'px'
		: '0px'};"
>
	<div class="turns-box">
		<TurnsBox color="blue" />
	</div>
	<div class="pictograph-container">
		<GraphEditorPictographContainer maxHeight={maxEditorHeight} />
	</div>
	<div class="turns-box">
		<TurnsBox color="red" />
	</div>
</div>

<style>
	.graph-editor {
		position: relative;
		background-color: #f4f4f4;
		border-top: 2px solid #ccc;
		overflow: hidden;
		width: 100%;
		transition: height var(--animation-duration) ease-in-out;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		height: 100%;
	}

	.turns-box {
		flex: 1;
		display: flex;
	}

	.pictograph-container {
		flex: 2;
		display: flex;
	}
</style>
