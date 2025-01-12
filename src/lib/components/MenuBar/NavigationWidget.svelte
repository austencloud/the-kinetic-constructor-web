<script lang="ts">
	import NavigationButton from './NavigationButton.svelte';

	export let onTabChange;

	let activeTab = 0;
	const tabNames = ['Construct ⚒️', 'Generate 🤖', 'Browse 🔍', 'Learn 🧠', 'Write ✍️'];

	const handleTabClick = (index: number) => {
		activeTab = index;
		onTabChange && onTabChange(index);
	};
</script>

<div class="nav-container">
	{#each tabNames as name, index}
		<NavigationButton {name} isActive={index === activeTab} onClick={() => handleTabClick(index)} />
	{/each}
</div>

<style>
	.nav-container {
		display: flex;
		justify-content: center;
		gap: 10px;
	}
</style>
