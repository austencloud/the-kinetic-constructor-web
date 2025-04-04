<script lang="ts">
	// Removed unused fade import

	export let categoryKeys: string[] = [];
	export let selectedTab: string | null = null;
	export let isMobileDevice: boolean = false;
	export let onTabSelect: (tab: string) => void;
	// Removed unused transitionParams export

	function handleTabClick(categoryKey: string) {
		if (onTabSelect) {
			onTabSelect(categoryKey);
		}
	}
</script>

<div>
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

<style>
	.tabs {
		display: flex;
		justify-content: center;
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding: 0;
		margin: 0;
		max-width: 100%;
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
		padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 1.5vw, 1rem);
		cursor: pointer;
		font-weight: 500;
		font-size: clamp(0.75rem, 2vw, 0.9rem);
		color: #4b5563;
		border-bottom: 3px solid transparent;
		transition:
			border-color 0.2s ease-in-out,
			color 0.2s ease-in-out;
		white-space: nowrap;
		flex-shrink: 0;
		border-radius: 4px 4px 0 0;
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
		padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 1.5vw, 1rem);
		white-space: nowrap;
	}
</style>
