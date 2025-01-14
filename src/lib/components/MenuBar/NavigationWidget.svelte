<script lang="ts">
	import NavigationButton from './NavigationButton.svelte';
	import { createEventDispatcher } from 'svelte';
  
	const dispatch = createEventDispatcher();
  
	export const onTabChange: (index: number) => void = () => {};
	let activeTab = 0;
	const tabNames = ['Construct ⚒️', 'Generate 🤖', 'Browse 🔍', 'Learn 🧠', 'Write ✍️'];
  
	const handleTabClick = (index: number) => {
	  activeTab = index;
	  dispatch('tabChange', index);
	};
  </script>
  
  <div class="nav-container">
	{#each tabNames as name, index}
	  <NavigationButton {name} isActive={index === activeTab} onClick={() => handleTabClick(index)} />
	{/each}
  </div>
  
  <style>
	.nav-container {
	  display: flex;
	  justify-content: center;
	  gap: 1vw;
	}
  </style>
  