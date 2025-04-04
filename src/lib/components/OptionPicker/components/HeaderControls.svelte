<!-- src/lib/components/OptionPicker/components/HeaderControls.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import SortOptions from './FilterControls/SortOptions.svelte';

	// Props
	export let categoryKeys: string[] = [];
	export let selectedTab: string | null = null;
	export let isMobileDevice: boolean = false;
	export let onTabSelect: (tab: string) => void;
	export let transitionParams = { duration: 250, delay: 50 };

	// Local Handlers
	function handleTabClick(categoryKey: string) {
		if (onTabSelect) {
			onTabSelect(categoryKey);
		}
	}
</script>

<div class="filter-controls" transition:fade={transitionParams}>
	<SortOptions {isMobileDevice} />
	
	<div class="tabs-container">
		<div
			class="tabs"
			class:mobile-tabs={isMobileDevice}
			role="tablist"
			aria-label="Option Categories"
		>
			{#if categoryKeys.length > 0}
				{#each categoryKeys as categoryKey (categoryKey)}
					<button
						class="tab"
						class:active={selectedTab === categoryKey}
						class:mobile={isMobileDevice}
						on:click={() => handleTabClick(categoryKey)}
						role="tab"
						aria-selected={selectedTab === categoryKey}
						aria-controls="options-panel-{categoryKey}"
						id="tab-{categoryKey}"
					>
						{categoryKey}
					</button>
				{/each}
			{:else}
				<span class="no-categories-message">No categories available</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.filter-controls {
		display: flex;
		justify-content: space-between; /* Changed from center to space-between to put sort on right */
		align-items: center;
		flex-grow: 1;
		position: relative;
		width: 100%;
	}

	/* Add this style to position SortOptions correctly */
	:global(.sort-options) {
		position: relative;
		z-index: 10;
	}

	.tabs-container {
		display: flex;
		justify-content: center;
		width: 100%;
		overflow: hidden;
	}

	/* Rest of the styles unchanged */
	.tabs {
		display: flex;
		justify-content: center;
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
		padding: 0;
		margin: 0;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.mobile-tabs {
		flex-wrap: wrap;
		justify-content: center;
		overflow-x: hidden;
	}

	.tab {
		background: none;
		border: none;
		padding: 0.6rem clamp(0.8rem, 2vw, 1.2rem);
		cursor: pointer;
		font-weight: 500;
		font-size: clamp(0.9rem, 1.8vw, 1.1rem);
		color: #4b5563;
		border-bottom: 3px solid transparent;
		transition:
			border-color 0.2s ease-in-out,
			color 0.2s ease-in-out;
		white-space: nowrap;
		flex-shrink: 0;
		border-radius: 4px 4px 0 0;
	}

	.tab.mobile {
		padding: 0.5rem 0.8rem;
		font-size: 0.95rem;
	}

	.tab.active {
		border-color: #3b82f6;
		color: #1e40af;
		font-weight: 600;
	}

	.tab:hover:not(.active) {
		color: #1f2937;
		border-color: #d1d5db;
	}

	.tab:focus-visible {
		outline: 2px solid #60a5fa;
		outline-offset: -2px;
		background-color: rgba(59, 130, 246, 0.1);
	}

	.no-categories-message {
		color: #6b7280;
		font-style: italic;
		padding: 0.6rem 1rem;
		white-space: nowrap;
	}
</style>