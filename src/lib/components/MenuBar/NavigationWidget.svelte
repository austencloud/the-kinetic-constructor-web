<script lang="ts">
	import NavigationButton from './NavigationButton.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher();

	export let onTabChange: (index: number) => void = () => {};
	let activeTab = 0;

	// We’ll keep the same tabNames, tabEmojis, etc.
	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	// If we only want to differentiate “portrait vs. not portrait,” we can
	// still call it `isMobile` or `isPortrait`.
	let isMobile = false;

	function checkMobile() {
		if (typeof window === 'undefined') return;
		// If orientation: portrait => isMobile = true, else false.
		// Or your earlier logic: isMobile = window.innerWidth <= 768
		isMobile = window.matchMedia('(orientation: portrait)').matches;
	}

	function handleTabClick(index: number) {
		activeTab = index;
		dispatch('tabChange', index);
		onTabChange(index);
	}

	onMount(() => {
		checkMobile();
		// Listen for 'resize' and 'orientationchange'
		window.addEventListener('resize', checkMobile);
		window.addEventListener('orientationchange', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('orientationchange', checkMobile);
		};
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
				<!-- On mobile, just the emoji -->
				{tabEmojis[index]}
			{:else}
				<!-- On desktop, word + emoji -->
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
