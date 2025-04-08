<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import ViewControl from './ViewControl.svelte';
	import type { ViewModeDetail } from './ViewControl.svelte';

	// --- Props ---
	// ADDED: Receive selectedTab value from parent
	export let selectedTab: string | null;
	export let categoryKeys: string[] = []; // Add this prop to receive category keys
	export let showTabs: boolean = false; // Flag to determine if tabs should be shown

	// --- Context ---
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
	$: isMobileDevice = $layoutContext.isMobile;

	// --- Events ---
	const dispatch = createEventDispatcher<{
		viewChange: ViewModeDetail;
		tabSelect: string;
	}>();

	function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		dispatch('viewChange', event.detail);
	}

	function handleTabClick(categoryKey: string) {
		dispatch('tabSelect', categoryKey);
	}

	// Helper to format the display name for tabs
	function formatTabName(key: string): string {
		return key.charAt(0).toUpperCase() + key.slice(1);
	}
</script>

<div class="option-picker-header" class:mobile={isMobileDevice} data-testid="option-picker-header">
	<div class="header-content">
		<div class="spacer"></div>

		{#if showTabs && categoryKeys.length > 0}
			<div class="tabs" role="tablist" aria-label="Option Categories">
				{#each categoryKeys as categoryKey (categoryKey)}
					<button
						class="tab"
						class:active={selectedTab === categoryKey}
						on:click={() => handleTabClick(categoryKey)}
						role="tab"
						aria-selected={selectedTab === categoryKey}
						aria-controls={`options-panel-${categoryKey}`}
						id="tab-{categoryKey}"
					>
						{formatTabName(categoryKey)}
					</button>
				{/each}
			</div>
		{:else if showTabs}
			<span class="no-categories-message">No sub-categories</span>
		{:else}
			<div class="helper-message">Filter by category to see sections</div>
		{/if}

		<div class="view-controls">
			<ViewControl selectedTabValue={selectedTab} on:viewChange={handleViewChange} />
		</div>
	</div>
</div>

<style>
	.option-picker-header {
		width: 100%;
		position: relative;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		padding-top: 8px;
		min-height: auto;
		box-sizing: border-box;
	}

	.option-picker-header.mobile {
		padding-top: 4px;
		margin-bottom: 0.3rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: nowrap; /* Prevent wrapping */
		gap: 8px; /* Smaller gap to keep things on one line */
	}

	.spacer {
		flex: 1;
		min-width: 10px;
		max-width: 60px; /* Limit spacer size */
	}

	.view-controls {
		display: flex;
		align-items: center;
		flex-shrink: 0; /* Prevent shrinking */
	}

	/* Tab styles from HeaderControls.svelte */
	.tabs {
		display: flex;
		justify-content: center; /* Center the tabs */
		flex-wrap: wrap;
		gap: 4px 8px;
		padding: 0;
		margin: 0 auto; /* Center in available space */
		flex: 2; /* Give tabs more space */
	}

	.tab {
		background: transparent;
		border: none;
		padding: clamp(0.5rem, 1vw, 0.7rem) clamp(1rem, 1.5vw, 1.4rem);
		cursor: pointer;
		font-weight: 500;
		font-size: clamp(0.9rem, 2vw, 1.05rem);
		color: black;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
		white-space: nowrap;
		flex-shrink: 0;
		border-radius: 8px;
		margin: 0 2px 2px 2px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.tab.active {
		background: #0f172a;
		color: #38bdf8;
		font-weight: 600;
		box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
	}

	.tab:hover:not(.active) {
		background: #172033;
		color: #cbd5e1;
	}

	.tab:focus-visible {
		outline: 2px solid #60a5fa;
		outline-offset: 1px;
		background-color: rgba(59, 130, 246, 0.1);
	}

	.helper-message {
		color: black;
		font-style: italic;
		font-size: 1rem;
		text-align: center;
		padding: clamp(0.4rem, 1vw, 0.6rem);
		flex: 2;
	}

	.no-categories-message {
		color: #94a3b8;
		font-style: italic;
		padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 1.5vw, 1.2rem);
		white-space: nowrap;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.tabs {
			justify-content: center;
			margin-bottom: 8px;
		}

		.view-controls {
			margin-left: 0;
			justify-content: center;
		}

		.spacer {
			display: none; /* Hide spacer on mobile */
		}
	}
</style>
