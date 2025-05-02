<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import ViewControl from './ViewControl';
	import type { ViewModeDetail } from './ViewControl/types';

	// --- Props ---
	export let selectedTab: string | null;
	export let categoryKeys: string[] = [];
	export let showTabs: boolean = false;

	// --- Context ---
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
	$: isMobileDevice = $layoutContext.isMobile;

	// --- Local State ---
	$: useShortLabels = isMobileDevice;

	// --- Events ---
	const dispatch = createEventDispatcher<{
		viewChange: ViewModeDetail;
		tabSelect: string;
	}>();

	// --- Event Handlers & Helpers ---
	function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		dispatch('viewChange', event.detail);
	}

	function handleTabClick(categoryKey: string) {
		dispatch('tabSelect', categoryKey);
	}

	// --- Mappings for Labels ---
	const longLabels: Record<string, string> = {
		Type1: 'Type 1',
		Type2: 'Type 2',
		Type3: 'Type 3',
		Type4: 'Type 4',
		Type5: 'Type 5',
		Type6: 'Type 6',
		'Unknown Type': 'Unknown',
		alpha: 'Alpha',
		beta: 'Beta',
		gamma: 'Gamma',
		Continuous: 'Continuous',
		'One Reversal': 'One Reversal',
		'Two Reversals': 'Two Reversals'
	};
	const shortLabels: Record<string, string> = {
		Type1: '1',
		Type2: '2',
		Type3: '3',
		Type4: '4',
		Type5: '5',
		Type6: '6',
		'Unknown Type': '?',
		alpha: 'α',
		beta: 'β',
		gamma: 'Γ',
		Continuous: 'Cont.',
		'One Reversal': '1 Rev',
		'Two Reversals': '2 Rev'
	};

	// --- Formatting Functions ---
	function formatTabName(key: string): string {
		if (!key) return '';
		return (
			longLabels[key] ||
			key
				.replace(/([A-Z])/g, ' $1')
				.trim()
				.replace(/^\w/, (c) => c.toUpperCase())
		);
	}
	function formatShortTabName(key: string): string {
		if (!key) return '';
		return shortLabels[key] || formatTabName(key);
	}
</script>

<div class="option-picker-header" class:mobile={isMobileDevice} data-testid="option-picker-header">
	<div class="header-content">
		<div class="view-controls">
			<ViewControl on:viewChange={handleViewChange} />
		</div>

		{#if showTabs}
			{#if categoryKeys.length > 0}
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
							title={formatTabName(categoryKey)}
						>
							{useShortLabels ? formatShortTabName(categoryKey) : formatTabName(categoryKey)}
						</button>
					{/each}
				</div>
			{:else}
				<!-- Placeholder when tabs are shown but empty -->
				<div class="tabs-placeholder">
					<span class="no-categories-message">No sub-categories</span>
				</div>
			{/if}
		{:else}
			<!-- Message shown when tabs are hidden (e.g., showing all) -->
			<div class="helper-message">⬅️ Showing all - filter to see sections</div>
		{/if}
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
		justify-content: flex-start; /* Align items to the start */
		align-items: center;
		flex-wrap: nowrap;
		/* This gap provides spacing between .view-controls and the next element */
		gap: 25px;
	}

	.view-controls {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		/* No specific margin needed here, gap on parent handles spacing */
	}

	.tabs {
		display: flex;
		justify-content: flex-start;
		flex-wrap: wrap;
		gap: 4px 8px;
		padding: 0;
		margin: 0;
		flex-grow: 1; /* Allow tabs container to grow */
		flex-shrink: 1;
		flex-basis: 0;
		min-width: 50px;
	}

	/* Placeholder used only for "No sub-categories" message */
	.tabs-placeholder {
		display: flex;
		justify-content: flex-start; /* Align message left */
		align-items: center;
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: 0;
		min-width: 50px;
		min-height: 30px; /* Ensure it has some height */
	}

	.tab {
		background: transparent;
		border: none;
		padding: clamp(0.5rem, 1vw, 0.7rem) clamp(0.8rem, 1.2vw, 1.2rem);
		cursor: pointer;
		font-weight: 500;
		font-size: clamp(0.9rem, 2vw, 1.05rem);
		color: white;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
		white-space: nowrap;
		flex-shrink: 0;
		border-radius: 8px;
		margin: 0 2px 2px 2px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 25px;
		max-width: 180px;
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

	/* Helper message shown when showTabs is false */
	.helper-message {
		color: white;
		font-style: italic;
		font-size: 1rem;
		padding: clamp(0.4rem, 1vw, 0.6rem);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		/* No text-align needed, flex alignment handles it */
		/* No flex-grow needed, it should hug the view controls */
		flex-shrink: 1; /* Allow shrinking if needed */
	}

	.no-categories-message {
		color: #94a3b8;
		font-style: italic;
		padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 1.5vw, 1.2rem);
		white-space: nowrap;
		/* text-align: center; Removed, placeholder is justify-content: flex-start */
	}

	/* --- Mobile Responsiveness --- */
	@media (max-width: 640px) {
		.header-content {
			flex-direction: row; /* Keep items on the same line */
			align-items: center; /* Center align items vertically */
			width: 100%;
			gap: 4px; /* Reduced horizontal gap for mobile */
			flex-wrap: nowrap; /* Prevent wrapping to next line */
			justify-content: space-between; /* Distribute space better */
		}

		.tabs,
		.tabs-placeholder,
		.helper-message {
			flex-grow: 1; /* Allow tabs to take remaining space */
			width: auto; /* Don't force full width */
			max-width: calc(100% - 90px); /* Leave space for view control */
		}

		.tabs {
			justify-content: flex-start; /* Ensure tabs start from left */
			flex-wrap: nowrap; /* Prevent tabs from wrapping */
			overflow-x: visible; /* Don't create scrollable area */
			width: auto; /* Allow container to size to content */
			display: flex;
		}

		.view-controls {
			flex-shrink: 0; /* Prevent view controls from shrinking */
		}

		.helper-message {
			padding-left: 0; /* Adjust padding if needed */
		}

		.tabs-placeholder {
			justify-content: flex-start; /* Ensure "No sub-categories" aligns left */
		}

		/* Make tabs more compact on mobile but still easily clickable */
		.tab {
			padding: 6px 8px;
			font-size: 0.85rem;
			margin: 0 2px 2px 0;
			min-width: 36px;
			height: 36px; /* Fixed height for better touch targets */
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			flex: 1; /* Allow buttons to grow and shrink */
			max-width: 60px; /* Limit maximum width */
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
</style>
