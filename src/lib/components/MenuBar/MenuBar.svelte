<script lang="ts">
	import NavigationWidget from './NavigationWidget.svelte';
	import SettingsButton from './SettingsButton/SettingsButton.svelte';
	import SocialMediaWidget from './SocialMediaWidget/SocialMediaWidget.svelte';
	import { createEventDispatcher } from 'svelte';

	export let background: string;
	export let onChangeBackground: (newBackground: string) => void = () => {};
	export let onTabChange: (index: number) => void = () => {};

	const dispatch = createEventDispatcher<{ tabChange: number; settingsClick: void }>();

	const handleTabChange = (index: number) => {
		dispatch('tabChange', index);
		onTabChange(index);
	};

	const handleSettingsClick = () => {
		dispatch('settingsClick');
	};
</script>

<header class="menu-bar">
	<SocialMediaWidget />
	<NavigationWidget on:tabChange={(e) => handleTabChange(e.detail)} />
	<SettingsButton {background} {onChangeBackground} on:click={handleSettingsClick} />
</header>

<style>
	.menu-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 4px;
	}
</style>
