<script lang="ts">
	import TurnsBox from './TurnsBox/TurnsBox.svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';

	export let isExpanded: boolean;
	export let animationDuration: number;
	export let maxEditorHeight: number; // e.g. 300

	const BORDER_PERCENTAGE = 0.02;

	$: borderSize = Math.floor(maxEditorHeight * BORDER_PERCENTAGE);


	$: contentWidth = maxEditorHeight - 2 * borderSize;

	// Pictograph data
	const dummyPictographData = { grid: '/diamond_grid.svg', name: 'Graph Editor' };
</script>

<div
	class="graph-editor"
	style="--animation-duration: {animationDuration}ms; height: {isExpanded
		? maxEditorHeight + 'px'
		: '0px'};"
>
	<div class="turns-box-container">
		<TurnsBox color="blue" />
	</div>

	<div
		class="pictograph-container"
		style="
			border: {borderSize}px solid gold; 
			width: {contentWidth}px; 
			height: {contentWidth}px; 
		"
	>
		<Pictograph pictographData={dummyPictographData} interactive={false} onClick={undefined} />
	</div>

	<div class="turns-box-container">
		<TurnsBox color="red" />
	</div>
</div>

<style>
	.graph-editor {
		position: relative;
		background-color: #f4f4f4;
		overflow: hidden;
		transition: height var(--animation-duration) ease-in-out;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		justify-content: space-between;
	}

	.turns-box-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: stretch;
		height: 100%;
		min-width: 0;
	}

	.pictograph-container {
		cursor:default
	}
</style>
