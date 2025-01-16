<script lang="ts">
	import NavigationButton from './NavigationButton.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export const onTabChange: (index: number) => void = () => {};
	let activeTab = 0;
	const tabNames = ['Construct ⚒️', 'Generate 🤖', 'Browse 🔍', 'Learn 🧠', 'Write ✍️'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];
	let isMobile = false;

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	const handleTabClick = (index: number) => {
		activeTab = index;
		dispatch('tabChange', index);
	};
</script>

<div class="nav-container">
	{#each tabNames as name, index}
		<NavigationButton {name} isActive={index === activeTab} onClick={() => handleTabClick(index)}>
			{#if isMobile}
				{tabEmojis[index]}
			{:else}
				{name}
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