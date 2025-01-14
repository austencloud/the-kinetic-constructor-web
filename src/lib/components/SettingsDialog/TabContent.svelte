<script lang="ts">
	import { fly } from 'svelte/transition';
	export let activeTab: string;
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;

	import UserProfileTab from './UserProfileTab.svelte';
	import PropTypeTab from './PropTypeTab/PropTypeTab.svelte';
	import BackgroundTab from './BackgroundTab.svelte';
	import VisibilityTab from './VisibilityTab.svelte';
	import BeatLayoutTab from './BeatLayoutTab.svelte';

	let tabs = ['User', 'Prop Type', 'Background', 'Visibility', 'Beat Layouts'];
	let previousTabIndex = tabs.indexOf(activeTab);
	let activeTabIndex = tabs.indexOf(activeTab);

	$: activeTabIndex = tabs.indexOf(activeTab); // Update index on tab change
	$: {
		previousTabIndex = activeTabIndex; // Store the last active tab index
	}

	// Calculate fly direction for content
	const getFlyDirection = (current: number, previous: number) => (current > previous ? 300 : -300);
</script>

<div class="tab-content">
	{#each tabs as tab, index}
		{#if activeTab === tab}
			<div
				transition:fly={{ x: getFlyDirection(activeTabIndex, previousTabIndex), duration: 300 }}
				style="visibility: visible;"
			>
				{#if tab === 'User'}
					<UserProfileTab />
				{:else if tab === 'Prop Type'}
					<PropTypeTab />
				{:else if tab === 'Background'}
					<BackgroundTab {background} {onChangeBackground} />
				{:else if tab === 'Visibility'}
					<VisibilityTab />
				{:else if tab === 'Beat Layouts'}
					<BeatLayoutTab />
				{/if}
			</div>
		{/if}
	{/each}
</div>

<style>
	.tab-content {
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		height: 100%;
	}

	.tab-content > div {
		position: absolute;
		width: 100%;
		height: 100%;
	}
</style>
