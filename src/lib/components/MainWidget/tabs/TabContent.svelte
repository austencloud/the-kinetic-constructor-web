<script lang="ts">
	// Import necessary components
	import PlaceholderTab from './PlaceholderTab.svelte';
	import ConstructTab from '$lib/components/ConstructTab/ConstructTab.svelte';
	import GenerateTab from '$lib/components/GenerateTab/GenerateTab.svelte';
	import BrowseTab from '$lib/components/BrowseTab/BrowseTab.svelte';
	import LearnTab from '$lib/components/LearnTab/LearnTab.svelte';
	import WriteTab from '$lib/write/index.svelte';
	// Import transitions
	import { crossfade, fade } from 'svelte/transition';

	// --- XState Imports ---
	import { tabs } from '$lib/components/MainWidget/state/appState';
	import { useSelector } from '@xstate/svelte';
	import { appService } from '$lib/state/machines/app/app.machine';

	// --- Get current tab index directly from the app service ---
	const currentTabStore = useSelector(appService, (state) => state.context.currentTab);

	// --- Reactive derivations ---
	$: currentTabIndex = $currentTabStore as number;
	$: activeTab =
		currentTabIndex >= 0 && currentTabIndex < tabs.length ? tabs[currentTabIndex] : null;

	// Create a crossfade transition
	const [send, receive] = crossfade({
		duration: 400,
		fallback(node) {
			return fade(node, { duration: 300 });
		}
	});
</script>

<div class="tab-content-container">
	{#if activeTab}
		{#key activeTab.id}
			<div
				in:receive={{ key: activeTab.id }}
				out:send={{ key: activeTab.id }}
				class={activeTab.id === 'construct' ||
				activeTab.id === 'generate' ||
				activeTab.id === 'browse' ||
				activeTab.id === 'learn' ||
				activeTab.id === 'write'
					? 'split-view-container'
					: 'placeholderContainer'}
			>
				{#if activeTab.id === 'construct'}
					<ConstructTab />
				{:else if activeTab.id === 'generate'}
					<GenerateTab />
				{:else if activeTab.id === 'browse'}
					<BrowseTab />
				{:else if activeTab.id === 'learn'}
					<LearnTab />
				{:else if activeTab.id === 'write'}
					<WriteTab />
				{:else}
					<PlaceholderTab icon={activeTab.icon} title={activeTab.title} />
				{/if}
			</div>
		{/key}
	{/if}
</div>

<style>
	.tab-content-container {
		position: relative; /* Crucial for absolute positioning of children during transition */
		width: 100%;
		height: 100%;
		overflow: hidden; /* Prevent content spill during transition */
	}

	/* Ensure the direct children of the #key block can overlap during transition */
	.split-view-container,
	.placeholderContainer {
		position: absolute; /* Changed from relative to absolute */
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex; /* Keep flex for split-view */
		box-sizing: border-box; /* Include padding/border in element's total width and height */
	}

	/* Styles for the placeholder content */
	.placeholderContainer {
		/* display: flex; is already set above */
		/* width: 100%; height: 100%; position: absolute; are set above */
		/* Ensure placeholder content inside is centered if needed */
		align-items: center;
		justify-content: center;
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
