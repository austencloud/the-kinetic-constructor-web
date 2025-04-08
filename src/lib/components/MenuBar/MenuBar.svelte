<script lang="ts">
	import NavWidget from './NavWidget/NavWidget.svelte';
	import SettingsButton from './SettingsButton/SettingsButton.svelte';
	// REMOVED: import SettingsPlaceholder from './SettingsButton/SettingsPlaceholder.svelte';
	import { createEventDispatcher } from 'svelte';

	export let onSettingsClick: () => void;

	const dispatch = createEventDispatcher();

	function handleTabChange(event: CustomEvent<number>) {
		dispatch('tabChange', event.detail);
	}
</script>

<header class="menu-bar">
	<SettingsButton on:click={onSettingsClick} />

	<div class="nav-widget-wrapper">
		<NavWidget on:tabChange={handleTabChange} />
	</div>
</header>

<style>
	.menu-bar {
		display: flex;
		/* REMOVED: justify-content: space-between; */
		align-items: center;
		padding: 4px;
		/* Add position relative if any children need absolute positioning relative to the bar */
		position: relative;
	}

	/* This wrapper allows NavWidget to center itself in the remaining space */
	.nav-widget-wrapper {
		margin-left: auto;
		margin-right: auto;
		/* Optional: Add some padding if needed to ensure space from edges if window is narrow */
		/* padding: 0 20px; */
	}

	/* Alternatively, if SettingsButton needs to be absolutely positioned */
	/* .menu-bar > :first-child { */
	/* position: absolute; */
	/* left: 4px; */
	/* top: 50%; */
	/* transform: translateY(-50%); */
	/* } */
</style>
