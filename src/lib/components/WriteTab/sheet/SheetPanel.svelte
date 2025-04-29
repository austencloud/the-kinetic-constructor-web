<script lang="ts">
	import { onMount } from 'svelte';
	import ActHeader from './header/ActHeader.svelte';
	import BeatGrid from './grid/BeatGrid.svelte';
	import CueScroll from './cue/CueScroll.svelte';
	import { uiStore } from '../stores/uiStore';

	// Handle synchronized scrolling between beat grid and cue scroll
	function handleBeatGridScroll(event: CustomEvent) {
		uiStore.updateBeatGridScroll(event.detail.scrollTop);
		uiStore.updateCueScrollPosition(event.detail.scrollTop);
	}

	function handleCueScrollScroll(event: CustomEvent) {
		uiStore.updateCueScrollPosition(event.detail.scrollTop);
		uiStore.updateBeatGridScroll(event.detail.scrollTop);
	}
</script>

<div class="sheet-panel">
	<ActHeader />

	<div class="sheet-content">
		<CueScroll on:scroll={handleCueScrollScroll} />
		<BeatGrid on:scroll={handleBeatGridScroll} />
	</div>
</div>

<style>
	.sheet-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		background-color: #1a1a1a;
		color: #e0e0e0;
	}

	.sheet-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}
</style>
