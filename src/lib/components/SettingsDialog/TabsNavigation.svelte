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
		font-size: 1.2rem;
		transition: background-color 0.3s, transform 0.3s;
	}
	.tab-button:hover {
		transform: scale(1.05);
	}
	.tab-button.active {
		background: #007bff;
		color: white;
		border-radius: 4px;
		box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
	}
</style>
