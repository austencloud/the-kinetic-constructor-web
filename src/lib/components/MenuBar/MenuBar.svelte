<script lang="ts">
	import NavigationWidget from './NavigationWidget.svelte';
	import SettingsButton from './SettingsButton/SettingsButton.svelte';
	import SocialMediaWidget from './SocialMediaWidget/SocialMediaWidget.svelte';
	
	export let background: string;
	export let onTabChange;
	export let onChangeBackground: (e: CustomEvent) => void;

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<header class="menu-bar">
	<SocialMediaWidget />
	<NavigationWidget {onTabChange} />
	<SettingsButton
		{background}
		{onChangeBackground}
		on:changeBackground={(e) => onChangeBackground(e.detail)}
		on:click={() => dispatch('settingsClick')}
	/>
</header>

<style>
	.menu-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 4px;
	}
</style>
