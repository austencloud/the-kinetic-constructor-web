<script lang="ts">
	import NavigationButton from './NavigationButton.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher();

	export let onTabChange: (index: number) => void = () => {};
	let activeTab = 0;

	// Remove emojis from `tabNames`
	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	let isMobile = false;

	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.matchMedia("(orientation: portrait)").matches;
		}
	}

	onMount(() => {
		checkMobile();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
	});

	function handleTabClick(index: number) {
		activeTab = index;
		dispatch('tabChange', index);
		onTabChange(index);
	}
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
