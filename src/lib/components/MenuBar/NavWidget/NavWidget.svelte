<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import NavButton from './NavButton.svelte';
	import { isMobile, isPortrait } from '../../../utils/deviceUtils';

	const dispatch = createEventDispatcher();

	let isMobileDevice = false;
	let isPortraitMode = false;

	let activeTab = 0;

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	function handleTabClick(index: number) {
		// Update only the clicked tab as active
		activeTab = index;

		// Dispatch an event to the parent component with the new tab index
		dispatch('tabChange', index);
	}

	const updateModes = () => {
		isMobileDevice = isMobile();
		isPortraitMode = isPortrait();
	};

	onMount(() => {
		updateModes();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateModes);
		}
	});
</script>

<div class="nav-widget">
	{#each tabNames as name, index}
		<NavButton 
			isActive={index === activeTab} 
			onClick={() => handleTabClick(index)}
		>
			{#if !isPortraitMode && !isMobileDevice}
				{name} {tabEmojis[index]}
			{:else if isPortraitMode}
				{tabEmojis[index]}
			{:else if isMobileDevice}
				{tabEmojis[index]}
			{/if}
		</NavButton>
	{/each}
</div>

<style>
	.nav-widget {
		display: flex;
		justify-content: center;
		gap: 1vw;
	}
</style>