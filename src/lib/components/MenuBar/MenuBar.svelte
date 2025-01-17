<script lang="ts">
	import NavWidget from './NavWidget/NavWidget.svelte';
	import SettingsButton from './SettingsButton/SettingsButton.svelte';
	import SettingsPlaceholder from './SettingsButton/SettingsPlaceholder.svelte';
	import { createEventDispatcher } from 'svelte';

	export let background: string;
	export let onChangeBackground: (newBackground: string) => void = () => {};
	export let onTabChange: (index: number) => void = () => {};

	const dispatch = createEventDispatcher();

	function handleTabChange(event: CustomEvent) {
		const index = event.detail;
		dispatch('tabChange', index);
		onTabChange(index);
	}

	function handleSettingsClick() {
		dispatch('settingsClick');
	}
</script>

<header class="menu-bar">
	<SettingsButton
		{background}
		{onChangeBackground}
		on:click={handleSettingsClick}
	/>

	<!-- Pass isFullScreen to NavWidget -->
	<NavWidget  on:tabChange={handleTabChange} />
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
