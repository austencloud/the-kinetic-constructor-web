<script lang="ts">
	export let activeTab: string;
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;
  
	import UserProfileTab from './UserProfileTab.svelte';
	import PropTypeTab from './PropTypeTab.svelte';
	import BackgroundTab from './BackgroundTab.svelte';
	import VisibilityTab from './VisibilityTab.svelte';
	import BeatLayoutTab from './BeatLayoutTab.svelte';
  </script>
  
  <div class="tab-content">
	{#if activeTab === 'User'}
	  <UserProfileTab />
	{:else if activeTab === 'Prop Type'}
	  <PropTypeTab />
	{:else if activeTab === 'Background'}
	  <BackgroundTab {background} {onChangeBackground} />
	{:else if activeTab === 'Visibility'}
	  <VisibilityTab />
	{:else if activeTab === 'Beat Layouts'}
	  <BeatLayoutTab />
	{/if}
  </div>
  
  <style>
	.tab-content {
	  display: flex;
	  flex: 1;
	  flex-direction: column;
	  overflow: auto;
	}
  </style>
  