<script lang="ts">
	import NavigationButton from './NavigationButton.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();

	export let onTabChange: (index: number) => void = () => {};
	let activeTab = 0;

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	let isMobile = false;

	/**
	 * Update `isMobile` based on screen width.
	 * This runs only in the browser.
	 */
	function checkMobile() {
		if (!browser) return;
		const w = window.innerWidth;
		isMobile = w <= 768; // Set a max-width threshold for mobile devices
	}

	function handleTabClick(index: number) {
		activeTab = index;
		dispatch('tabChange', index);
		onTabChange(index);
	}

	onMount(() => {
		if (!browser) return;
		checkMobile();
		window.addEventListener('resize', checkMobile);
	});

	onDestroy(() => {
		if (!browser) return;
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
