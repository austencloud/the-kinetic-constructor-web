<script lang="ts">
	import NavigationButton from './NavigationButton.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment'; // Import browser check from SvelteKit

	const dispatch = createEventDispatcher();

	export let onTabChange: (index: number) => void = () => {};
	let activeTab = 0;

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	let isMobile: boolean;

	/**
	 * Update `isMobile` based on orientation or viewport size.
	 * This runs only in the browser.
	 */
	function checkMobile() {
		if (!browser) return; // Only run in the browser
		const w = window.innerWidth;
		const h = window.innerHeight;
		isMobile = h > w; // Portrait orientation
	}

	function handleTabClick(index: number) {
		activeTab = index;
		dispatch('tabChange', index);
		onTabChange(index);
	}

	onMount(() => {
		if (!browser) return; // Skip for SSR
		checkMobile();
		window.addEventListener('resize', checkMobile);
	});

	onDestroy(() => {
		if (!browser) return; // Skip for SSR
		window.removeEventListener('resize', checkMobile);
	});
</script>

<div class="nav-container">
	{#each tabNames as name, index}
		<NavigationButton
			isMobile={isMobile}
			isActive={index === activeTab}
			onClick={() => handleTabClick(index)}
		>
			{#if isMobile}
				{tabEmojis[index]}
			{:else}
				{name} {tabEmojis[index]}
			{/if}
		</NavigationButton>
	{/each}
</div>

<style>
	.nav-container {
		display: flex;
		justify-content: center;
		gap: 1vw;
	}
</style>
