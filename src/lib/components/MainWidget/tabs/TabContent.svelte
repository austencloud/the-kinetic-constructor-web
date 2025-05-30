<script lang="ts">
	// Import necessary components
	import ConstructTab from '$lib/components/ConstructTab/ConstructTab.svelte';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { appState } from '$lib/state/simple/appState.svelte';


	// We're always in Construct mode
	const isGenerateTab = false;
</script>

<div class="tab-content-container">
	<div class="split-view-container" in:fade={{ duration: 300 }}>
		<ConstructTab isGenerateMode={isGenerateTab} />
	</div>
</div>

<style>
	.tab-content-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.split-view-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		box-sizing: border-box;
	}

	/* Responsive styles */
	@media (orientation: portrait) {
		.split-view-container {
			flex-direction: column;
		}
	}

	@media (orientation: landscape) {
		.split-view-container {
			flex-direction: row;
		}
	}
</style>
