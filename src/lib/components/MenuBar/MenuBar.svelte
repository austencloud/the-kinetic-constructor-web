<script lang="ts">
	import NavigationWidget from './NavigationWidget.svelte';
	import SettingsButton from './SettingsButton/SettingsButton.svelte';
	import SettingsPlaceholder from './SettingsPlaceholder.svelte';
	import { createEventDispatcher } from 'svelte';
  
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void = () => {};
	export let onTabChange: (index: number) => void = () => {};
  
	const dispatch = createEventDispatcher<{ tabChange: number; settingsClick: void }>();
  
	function handleTabChange(index: number) {
	  dispatch('tabChange', index);
	  onTabChange(index);
	}
  
	function handleSettingsClick() {
	  dispatch('settingsClick');
	}
  </script>
  
  <header class="menu-bar">
	<!-- Left placeholder sized like the SettingsButton -->
	<SettingsPlaceholder />
	
	<!-- Navigation in the middle -->
	<NavigationWidget on:tabChange={(e) => handleTabChange(e.detail)} />
	
	<!-- Real SettingsButton on the right -->
	<SettingsButton
	  {background}
	  {onChangeBackground}
	  on:click={handleSettingsClick}
	/>
  </header>
  
  <style>
	.menu-bar {
	  display: flex;
	  justify-content: space-between; /* space between left placeholder & right button */
	  align-items: center;
	  padding: 4px;
	  /* you might also do max-height or clamp here if you want a fixed bar height */
	}
  </style>
  