<script lang="ts">
	import NavButton from './NavButton.svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let isFullScreen: boolean = false; // Receive fullscreen state
	export let onTabChange: (index: number) => void = () => {};
	let activeTab = 0;

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	let isMobile = false;

	// Determine layout dynamically based on orientation
	function checkLayout() {
		if (typeof window !== 'undefined') {
			isMobile = window.matchMedia("(orientation: portrait)").matches;
		}
	}

	function handleTabClick(index: number) {
		activeTab = index;
		onTabChange(index);
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			checkLayout(); // Initial check
			window.addEventListener('resize', checkLayout);
		}
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', checkLayout);
			}
		};
	});

	$: checkLayout(); // Update layout on `isFullScreen` change
</script>

<div class="nav-widget">
	{#each tabNames as name, index}
		<NavButton
			isMobile={isMobile}
			isFullScreen={isFullScreen}
			isActive={index === activeTab}
			onClick={() => handleTabClick(index)}
		>
			{#if isFullScreen}
				{name} {tabEmojis[index]} <!-- Fullscreen: Full Label -->
			{:else if isMobile}
				{tabEmojis[index]} <!-- Mobile: Emoji only -->
			{:else}
				{name} {tabEmojis[index]} <!-- Desktop: Full Label -->
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
