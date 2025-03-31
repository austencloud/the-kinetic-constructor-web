<script lang="ts">
	import NavWidget from './NavWidget/NavWidget.svelte';
	import SettingsButton from './SettingsButton/SettingsButton.svelte';
	import SettingsPlaceholder from './SettingsButton/SettingsPlaceholder.svelte';
	import { createEventDispatcher } from 'svelte';

	export let background: string;
	export let onChangeBackground: (newBackground: string) => void = () => {};

	const dispatch = createEventDispatcher();

	function handleSettingsClick() {
		dispatch('settingsClick');
	}

	function handleTabChange(event: CustomEvent<number>) {
		dispatch('tabChange', event.detail);
	}
</script>

<header class="menu-bar">
	<SettingsButton
		{background}
		{onChangeBackground}
		on:click={handleSettingsClick}
	/>

	<NavWidget on:tabChange={handleTabChange} />
	<SettingsPlaceholder />
</header>

<style>
	.menu-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px;
	}
</style>