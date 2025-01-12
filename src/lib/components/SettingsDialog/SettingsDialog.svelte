<script lang="ts">
	import BackgroundTab from './BackgroundTab.svelte';
	import UserProfileTab from './UserProfileTab.svelte';
	import VisibilityTab from './VisibilityTab.svelte';

	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;
	export let onClose: () => void;

	let currentTab = 'Background';

	const tabs = ['Background', 'User Profile', 'Visibility'];
</script>

<div
	style="border: 1px solid #ccc; padding: 20px; border-radius: 10px; width: 300px; background-color: white;"
>
	<div style="margin-bottom: 20px;">
		{#each tabs as tab}
			<button
				on:click={() => (currentTab = tab)}
				style="margin-right: 5px; padding: 10px; border-radius: 5px; background-color: {currentTab ===
				tab
					? '#ddd'
					: '#fff'};"
			>
				{tab}
			</button>
		{/each}
	</div>

	<div>
		{#if currentTab === 'Background'}
			<BackgroundTab {background} {onChangeBackground} on:changeBackground={(e) => onChangeBackground(e.detail.newBackground)} />
		{:else if currentTab === 'User Profile'}
			<UserProfileTab />
		{:else if currentTab === 'Visibility'}
			<VisibilityTab />
		{/if}
	</div>

	<button on:click={onClose} style="margin-top: 20px; padding: 10px; border-radius: 5px;">Close</button>
</div>
