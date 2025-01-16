<script lang="ts">
	import NavigationButton from './NavigationButton.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher();

	export let onTabChange: (index: number) => void = () => {};
	let activeTab = 0;

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	let isMobile = false;

	/**
	 * We'll define "isMobile" as "portrait orientation" or "small device," 
	 * whichever logic you prefer. 
	 * For orientation-based: if width < height => portrait => isMobile = true.
	 */
	function checkMobile() {
		if (typeof window === 'undefined') return;
		const w = window.innerWidth;
		const h = window.innerHeight;
		isMobile = (h > w); 
		// or use: isMobile = window.matchMedia('(max-width: 768px)').matches;
	}

	function handleTabClick(index: number) {
		activeTab = index;
		dispatch('tabChange', index);
		onTabChange(index);
	}

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);
	});

	onDestroy(() => {
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
