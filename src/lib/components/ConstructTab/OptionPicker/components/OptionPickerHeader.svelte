<script lang="ts">
	import { getContext } from 'svelte';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import ViewControl from './ViewControl';

	// --- Props using Svelte 5 runes ---
	const props = $props<{
		selectedTab: string | null;
		categoryKeys?: string[];
		showTabs?: boolean;
	}>();

	// Default values for optional props
	$effect(() => {
		if (props.categoryKeys === undefined) props.categoryKeys = [];
		if (props.showTabs === undefined) props.showTabs = false;
	});

	// --- Context ---
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);

	// --- Local State ---
	let isMobileDevice = $state(false);
	let useShortLabels = $state(false);
	let tabsContainerRef = $state<HTMLDivElement | null>(null);
	let isScrollable = $state(false);
	let compactMode = $state(false);
	let showScrollIndicator = $state(false);

	// Update mobile device state from context and set compact mode
	$effect(() => {
		// Get the layout context value safely
		const contextValue = layoutContext;

		// Check if the context exists and has the isMobile property
		if (contextValue && typeof contextValue === 'object' && 'isMobile' in contextValue) {
			// Use type assertion to ensure TypeScript knows this is a boolean
			isMobileDevice = Boolean(contextValue.isMobile);

			// Proactively set compact mode on mobile devices
			if (isMobileDevice) {
				compactMode = true;
			}
		} else {
			// Fallback to window width if context is not available
			isMobileDevice = window.innerWidth <= 640;
			if (isMobileDevice) {
				compactMode = true;
			}
		}

		// Add resize listener to update mobile state when window size changes
		const handleResize = () => {
			// Check if window width is mobile size
			const isMobile = window.innerWidth <= 640;
			if (isMobile) {
				isMobileDevice = true;
				compactMode = true;
			} else if (contextValue && typeof contextValue === 'object' && 'isMobile' in contextValue) {
				isMobileDevice = Boolean(contextValue.isMobile);
			} else {
				isMobileDevice = false;
			}

			// Force a re-check of tab overflow
			if (tabsContainerRef) {
				checkTabsOverflow();
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Determine when to use short labels - always use short labels on mobile
	$effect(() => {
		useShortLabels = isMobileDevice || compactMode;
	});

	// Check if tabs are scrollable
	$effect(() => {
		if (tabsContainerRef) {
			checkTabsOverflow();
		}
	});

	// Function to check if tabs are overflowing
	function checkTabsOverflow() {
		if (!tabsContainerRef) return;

		const { scrollWidth, clientWidth } = tabsContainerRef;

		// Check if content is wider than container
		isScrollable = scrollWidth > clientWidth;

		// Check if we're close to overflowing (within 20px)
		const isNearlyOverflowing = scrollWidth > clientWidth - 20;

		// Switch to compact mode if we're overflowing or nearly overflowing
		if ((isScrollable || isNearlyOverflowing) && !compactMode) {
			compactMode = true;

			// Force a re-check after a short delay to see if compact mode fixed the overflow
			setTimeout(() => {
				if (tabsContainerRef) {
					const { scrollWidth, clientWidth } = tabsContainerRef;
					isScrollable = scrollWidth > clientWidth;
					showScrollIndicator = isScrollable;
				}
			}, 50);
		}

		// Show scroll indicator when scrollable
		showScrollIndicator = isScrollable;
	}

	// --- Event Handlers & Helpers ---
	// Set up event listener for viewchange events
	$effect(() => {
		if (!tabsContainerRef) return;

		// Function to handle viewchange events
		const viewChangeHandler = (event: Event) => {
			// Check if this is a CustomEvent with detail
			if (event instanceof CustomEvent && event.detail) {
				// Forward the event to the parent
				const customEvent = new CustomEvent('viewChange', {
					detail: event.detail,
					bubbles: true
				});

				// Make sure tabsContainerRef is not null
				if (tabsContainerRef) {
					tabsContainerRef.dispatchEvent(customEvent);
				}
			}
		};

		// Add event listener
		document.addEventListener('viewchange', viewChangeHandler);

		// Clean up on destroy
		return () => {
			document.removeEventListener('viewchange', viewChangeHandler);
		};
	});

	function handleTabClick(categoryKey: string) {
		// Create a custom event that will bubble up to the parent component
		const customEvent = new CustomEvent('tabSelect', {
			detail: categoryKey,
			bubbles: true,
			composed: true // Allows the event to cross the shadow DOM boundary
		});

		// Dispatch the event directly from the component's root element
		// This ensures it bubbles up properly to parent components
		document.dispatchEvent(customEvent);
	}

	// Add resize observer to check for overflow
	$effect(() => {
		if (!tabsContainerRef) return;

		const resizeObserver = new ResizeObserver(() => {
			checkTabsOverflow();
		});

		resizeObserver.observe(tabsContainerRef);

		return () => {
			resizeObserver.disconnect();
		};
	});

	// Handle scroll events to update scroll indicator
	function handleScroll() {
		if (!tabsContainerRef) return;

		const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef;

		// Show indicator when not at the end of scroll
		showScrollIndicator = scrollLeft + clientWidth < scrollWidth - 10;
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
		'One Reversal': '1 Rev.',
		'Two Reversals': '2 Rev.'
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
		<div class="view-controls" class:compact={compactMode}>
			<ViewControl compact={compactMode} />
		</div>

		{#if props.showTabs}
			{#if props.categoryKeys && props.categoryKeys.length > 0}
				<div
					class="tabs"
					role="tablist"
					aria-label="Option Categories"
					bind:this={tabsContainerRef}
					onscroll={() => handleScroll()}
					class:scrollable={isScrollable}
				>
					{#each props.categoryKeys as categoryKey (categoryKey)}
						<button
							class="tab"
							class:active={props.selectedTab === categoryKey}
							onclick={() => handleTabClick(categoryKey)}
							role="tab"
							aria-selected={props.selectedTab === categoryKey}
							aria-controls={`options-panel-${categoryKey}`}
							id="tab-{categoryKey}"
							title={formatTabName(categoryKey)}
						>
							{useShortLabels ? formatShortTabName(categoryKey) : formatTabName(categoryKey)}
						</button>
					{/each}

					{#if showScrollIndicator}
						<div class="scroll-indicator"></div>
					{/if}
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
		flex-wrap: nowrap; /* Prevent tabs from wrapping to a new line */
		gap: 4px 8px;
		padding: 0;
		margin: 0;
		flex-grow: 1; /* Allow tabs container to grow */
		flex-shrink: 1;
		flex-basis: 0;
		min-width: 50px;
		overflow-x: auto; /* Enable horizontal scrolling */
		scrollbar-width: thin; /* For Firefox */
		scrollbar-color: rgba(255, 255, 255, 0.3) transparent; /* For Firefox */
		-ms-overflow-style: none; /* Hide scrollbar in IE and Edge */
		position: relative; /* For scroll indicator positioning */
		padding-bottom: 4px; /* Space for scrollbar */
	}

	/* Hide scrollbar in Webkit browsers by default */
	.tabs::-webkit-scrollbar {
		height: 4px;
		background: transparent;
	}

	.tabs::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	/* Show scrollbar on hover for better UX */
	.tabs:hover::-webkit-scrollbar {
		height: 6px;
	}

	/* Scrollable class for visual indication */
	.tabs.scrollable {
		padding-right: 20px; /* Space for scroll indicator */
	}

	/* Scroll indicator */
	.scroll-indicator {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 20px;
		background: linear-gradient(to right, transparent, rgba(15, 23, 42, 0.8) 40%);
		pointer-events: none; /* Allow clicks to pass through */
		z-index: 1;
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
		padding: clamp(0.4rem, 0.8vw, 0.7rem) clamp(0.6rem, 1vw, 1.2rem);
		cursor: pointer;
		font-weight: 500;
		font-size: clamp(0.85rem, 1.5vw, 1.05rem);
		color: white;
		transition:
			background-color 0.15s ease,
			color 0.15s ease,
			padding 0.3s ease,
			font-size 0.3s ease;
		white-space: nowrap;
		flex-shrink: 0;
		border-radius: 8px;
		margin: 0 2px 2px 2px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 36px; /* Ensure minimum touch target size */
		min-height: 36px; /* Ensure minimum touch target size */
		max-width: 180px;
		display: flex;
		align-items: center;
		justify-content: center;
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

	/* --- Responsive Layout --- */
	/* Compact mode styles */
	.view-controls.compact {
		flex-shrink: 0; /* Prevent view controls from shrinking */
		margin-right: 8px; /* Add some space between view controls and tabs */
	}

	/* Styles for when container width is constrained */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: row; /* Keep items on the same line */
			align-items: center; /* Center align items vertically */
			width: 100%;
			gap: 4px; /* Reduced horizontal gap */
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

		.tab {
			padding: clamp(0.3rem, 0.6vw, 0.5rem) clamp(0.4rem, 0.8vw, 0.8rem);
			font-size: clamp(0.8rem, 1.2vw, 0.9rem);
		}
	}

	/* Compact mode styles for tabs */
	.option-picker-header.mobile .tab,
	.view-controls.compact ~ .tabs .tab {
		padding: 6px 8px;
		font-size: 0.8rem;
		margin: 0 2px 2px 0;
		min-width: 36px;
		max-width: 45px; /* Narrower max-width to fit more tabs */
		height: 36px; /* Fixed height for better touch targets */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Mobile styles */
	@media (max-width: 640px) {
		.header-content {
			gap: 2px; /* Further reduce gap on mobile */
		}

		.view-controls {
			flex-shrink: 0; /* Prevent view controls from shrinking */
			margin-right: 4px; /* Reduce margin to save space */
		}

		.helper-message {
			padding-left: 0; /* Adjust padding if needed */
			font-size: 0.9rem; /* Smaller font size */
		}

		.tabs-placeholder {
			justify-content: flex-start; /* Ensure "No sub-categories" aligns left */
		}

		/* Make tabs more compact on mobile but still easily clickable */
		.tab {
			padding: 4px 6px;
			font-size: 0.75rem;
			margin: 0 2px 2px 0;
			min-width: 36px;
			height: 36px; /* Fixed height for better touch targets */
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 40px; /* Limit maximum width */
		}

		.no-categories-message {
			font-size: 0.9rem;
			padding: 0.4rem 0.6rem;
		}

		/* Reduce gap between tabs */
		.tabs {
			gap: 2px 4px;
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		.tab {
			padding: 4px 4px;
			font-size: 0.7rem;
			max-width: 36px; /* Make tabs even narrower */
			min-width: 32px; /* Allow slightly smaller min-width */
		}

		.helper-message {
			font-size: 0.8rem;
		}

		/* Further reduce gap between tabs */
		.tabs {
			gap: 1px 2px;
		}

		/* Reduce the header content gap */
		.header-content {
			gap: 1px;
		}

		/* Make view controls more compact */
		.view-controls {
			margin-right: 2px;
		}
	}
</style>
