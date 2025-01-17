<script lang="ts">
	import NavButton from './NavButton.svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();

	export let onTabChange: (index: number) => void = () => {};
	let activeTab = 0;

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	let isMobile = false;
	let hydrated = false;

	// Synchronously set `isMobile` before the first render
	if (browser) {
		isMobile = window.innerWidth <= 768; // Example threshold for mobile
		hydrated = true; // Mark the component as ready to render
	}

	// Handle screen resizing
	function checkMobile() {
		if (!browser) return;
		isMobile = window.innerWidth <= 768;
	}

	function handleTabClick(index: number) {
		activeTab = index;
		dispatch('tabChange', index);
		onTabChange(index);
	}

	onMount(() => {
		if (!browser) return;
		window.addEventListener('resize', checkMobile);
	});

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener('resize', checkMobile);
	});
</script>

{#if hydrated}
	<div class="nav-widget">
		{#each tabNames as name, index}
			<NavButton
				isMobile={isMobile}
				isActive={index === activeTab}
				onClick={() => handleTabClick(index)}
			>
				{#if isMobile}
					{tabEmojis[index]} <!-- Mobile: Emoji only -->
				{:else}
					{name} {tabEmojis[index]} <!-- Desktop: Name + Emoji -->
				{/if}
			</NavButton>
		{/each}
	</div>
{/if}

<style>
	.nav-widget {
		display: flex;
		justify-content: center;
		gap: 1vw;
	}
</style>
