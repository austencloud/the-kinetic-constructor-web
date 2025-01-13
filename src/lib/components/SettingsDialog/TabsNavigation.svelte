<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let activeTab: string;
	const dispatch = createEventDispatcher();

	const tabs = ['User', 'Prop Type', 'Background', 'Visibility', 'Beat Layouts'];

	const changeTab = (tab: string) => {
		dispatch('changeTab', tab);
	};
</script>

<div class="tabs" role="tablist">
	{#each tabs as tab}
		<button
			class="tab-button {activeTab === tab ? 'active' : ''}"
			role="tab"
			aria-selected={activeTab === tab}
			tabindex={activeTab === tab ? 0 : -1}
			on:click={() => changeTab(tab)}
		>
			{tab}
		</button>
	{/each}
</div>

<style>
	.tabs {
		display: flex;
		justify-content: space-around;
		margin-bottom: 20px;
	}

	.tab-button {
		flex: 1;
		padding: 10px;
		background: none;
		border: none;
		cursor: pointer;
	}

	.tab-button.active {
		background: #007bff;
		color: white;
	}
</style>
