<script lang="ts">
	import NavButton from './NavButton.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { isMobile, isPortrait } from '../../../utils/deviceUtils';
	let isMobileDevice = false;
	let isPortraitMode = false;

	export let onTabChange: (index: number) => void = () => {};
	let activeTab = 0;

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	function handleTabClick(index: number) {
		activeTab = index;
		onTabChange(index);
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
		<NavButton isActive={index === activeTab} onClick={() => handleTabClick(index)}>
			{#if !isPortraitMode && !isMobileDevice}
				{name} {tabEmojis[index]} <!-- Fullscreen: Full Label -->
			{:else if isPortraitMode}
				{tabEmojis[index]} <!-- Mobile: Emoji only -->
			{:else if isMobileDevice}
				{tabEmojis[index]} <!-- Desktop: Full Label -->
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
