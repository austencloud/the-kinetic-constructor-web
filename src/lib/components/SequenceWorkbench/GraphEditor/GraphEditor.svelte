<script lang="ts">
	import TurnsBox from './TurnsBox/TurnsBox.svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { DIAMOND } from '$lib/types/Constants';
	import { writable } from 'svelte/store';

	export let isExpanded: boolean;
	export let animationDuration: number;
	export let maxEditorHeight: number; // e.g. 300

	const BORDER_PERCENTAGE = 0.02;

	$: borderSize = Math.floor(maxEditorHeight * BORDER_PERCENTAGE);
	$: contentWidth = maxEditorHeight - 2 * borderSize;

	// ✅ Create a writable store
	const pictographDataStore = writable<PictographData>({
		letter: null,
		startPos: null,
		endPos: null,
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		blueMotionData: null,
		redMotionData: null,
		gridData: null,
		redPropData: null,
		bluePropData: null,
		redArrowData: null,
		blueArrowData: null,
		grid: ''
	});
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
		<!-- ✅ Pass the store directly instead of its value -->
		<Pictograph pictographDataStore={pictographDataStore} onClick={undefined} />
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
		cursor: default;
	}
</style>
