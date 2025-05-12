<script lang="ts">
	import { onMount } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { determineGroupKey, getSortedGroupKeys } from '../services/OptionsService';
	import { resize } from '../actions/resize';
	// Removed unused imports

	import SectionHeader from './SectionHeader.svelte';
	import OptionGroupGrid from './OptionGroupGrid.svelte';

	// Action to handle multi-group row overflow detection and prevention
	function setupMultiGroupRow(node: HTMLElement) {
		// Function to get the minimum width based on screen size
		function getMinGroupWidth() {
			// Match the media query breakpoints in the CSS
			if (window.innerWidth <= 380) {
				return 80; // Minimum width for very small screens
			} else if (window.innerWidth <= 640) {
				return 100; // Minimum width for small screens
			} else {
				return 140; // Default minimum width
			}
		}

		// Function to get margin and padding values based on screen size
		function getSpacingValues() {
			// Match the media query breakpoints in the CSS
			if (window.innerWidth <= 640) {
				return {
					margin: 0.1 * 16 * 2, // 0.1rem margin on each side for small screens
					padding: 0.1 * 16 * 2, // 0.1rem padding on each side for small screens
					gap: 0.1 * 16 // 0.1rem gap between items for small screens
				};
			} else {
				return {
					margin: 0.25 * 16 * 2, // 0.25rem margin on each side (from CSS)
					padding: 0.25 * 16 * 2, // 0.25rem padding on each side (from CSS)
					gap: 0.25 * 16 // 0.25rem gap between items (from CSS)
				};
			}
		}

		// Function to check and handle overflow
		function checkOverflow() {
			// Get all group items
			const groupItems = node.querySelectorAll('.multi-group-item');
			if (groupItems.length < 2) return; // No need to check if there's only one item

			// Get container width
			const containerWidth = node.clientWidth;

			// Get the minimum width and spacing values based on screen size
			const minGroupWidth = getMinGroupWidth();
			const { margin, padding, gap } = getSpacingValues();

			// Calculate minimum width needed for all items to fit in one row
			// Each item needs: minGroupWidth + margin + padding
			const itemWidth = minGroupWidth + margin + padding;
			const totalMinWidth = itemWidth * groupItems.length + gap * (groupItems.length - 1);

			// Check if items would overflow
			const wouldOverflow = totalMinWidth > containerWidth;

			// If items would overflow, add a class to the last item to force it to a new row
			if (wouldOverflow) {
				// Add class to the last item
				const lastItem = groupItems[groupItems.length - 1] as HTMLElement;
				lastItem.classList.add('force-new-row');

				// Log for debugging
				if (import.meta.env.DEV) {
					console.debug('Multi-group row would overflow, forcing last item to new row', {
						containerWidth,
						totalMinWidth,
						itemCount: groupItems.length
					});
				}
			} else {
				// Remove the class from all items if there's no overflow
				groupItems.forEach((item) => {
					item.classList.remove('force-new-row');
				});

				// Log for debugging
				if (import.meta.env.DEV && groupItems.length > 1) {
					console.debug('Multi-group row fits without overflow', {
						containerWidth,
						totalMinWidth,
						itemCount: groupItems.length
					});
				}
			}
		}

		// Create a resize observer to detect when the container width changes
		const resizeObserver = new ResizeObserver(() => {
			checkOverflow();
		});

		// Start observing the container
		resizeObserver.observe(node);

		// Also listen for window resize events to handle media query changes
		const handleWindowResize = () => {
			checkOverflow();
		};

		window.addEventListener('resize', handleWindowResize);

		// Initial check
		setTimeout(checkOverflow, 0);

		// Clean up when the component is destroyed
		return {
			destroy() {
				resizeObserver.disconnect();
				window.removeEventListener('resize', handleWindowResize);
			}
		};
	}

	// Import scroll utilities
	import { scrollActions } from '../store/scrollStore';

	type LayoutRow = {
		type: 'single' | 'multi';
		groups: Array<{ key: string; options: PictographData[] }>;
	};

	const {
		selectedTab = null,
		options = [],
		transitionKey = 'default'
	} = $props<{
		selectedTab?: string | null;
		options?: PictographData[];
		transitionKey?: string | number;
	}>();

	let panelElement: HTMLElement;
	let contentIsShort = $state(false); // Use $state for reactive updates
	let layoutRows: LayoutRow[] = $state([]); // Use $state for reactive updates
	let previousTab: string | null = null;
	let isReady = $state(false); // Track if component is ready to be shown, use $state

	// We don't need to track sortMethod in this component anymore
	// The grouping logic uses 'type' directly regardless of the global sortMethod

	// Save scroll position when scrolling
	function handleScroll() {
		if (panelElement && selectedTab) {
			scrollActions.savePosition(`tab-${selectedTab}`, panelElement.scrollTop);
		}
	}

	// Restore scroll position after transition
	function restoreScrollPosition() {
		if (panelElement && selectedTab) {
			scrollActions.restorePosition(panelElement, `tab-${selectedTab}`, 50);
		}
	}

	// Track tab changes for scroll position management
	$effect(() => {
		// This effect runs when selectedTab changes
		if (selectedTab !== previousTab && previousTab !== null) {
			// Save the scroll position of the previous tab before switching
			if (panelElement && previousTab) {
				scrollActions.savePosition(`tab-${previousTab}`, panelElement.scrollTop);
			}
		}
		previousTab = selectedTab;

		// When selectedTab changes, try to restore its scroll position
		// This needs to happen after the DOM updates for the new tab
		// Using a timeout allows the DOM to update.
		setTimeout(() => {
			restoreScrollPosition();
		}, 0);
	});

	// Restore scroll position when component mounts for the initial tab
	onMount(() => {
		// Ensure this runs after the panelElement is available and initial content is rendered
		setTimeout(() => {
			restoreScrollPosition();
		}, 50); // A small delay might be needed for initial render
	});

	// Group options based on the 'type' sort method, regardless of the global sortMethod
	// This ensures consistent grouping within the OptionsPanel.
	const MAX_ITEMS_FOR_SMALL_GROUP = 2;

	$effect(() => {
		const subGroups: Record<string, PictographData[]> = {};
		options.forEach((option: PictographData) => {
			const groupKey = determineGroupKey(option, 'type'); // Always group by 'type' here
			if (!subGroups[groupKey]) subGroups[groupKey] = [];
			subGroups[groupKey].push(option);
		});

		const currentSortedGroupKeys = getSortedGroupKeys(Object.keys(subGroups), 'type'); // Sort keys by 'type' logic

		const rows: LayoutRow[] = [];
		let i = 0;
		while (i < currentSortedGroupKeys.length) {
			const currentKey = currentSortedGroupKeys[i];
			const currentOptions = subGroups[currentKey];
			if (!currentOptions || currentOptions.length === 0) {
				i++;
				continue;
			}
			const isCurrentSmall = currentOptions.length <= MAX_ITEMS_FOR_SMALL_GROUP;

			if (isCurrentSmall) {
				const smallGroupSequence = [{ key: currentKey, options: currentOptions }];
				let j = i + 1;
				while (j < currentSortedGroupKeys.length) {
					const nextKey = currentSortedGroupKeys[j];
					const nextOptions = subGroups[nextKey];
					if (
						nextOptions &&
						nextOptions.length > 0 &&
						nextOptions.length <= MAX_ITEMS_FOR_SMALL_GROUP
					) {
						smallGroupSequence.push({ key: nextKey, options: nextOptions });
						j++;
					} else {
						break;
					}
				}
				if (smallGroupSequence.length >= 2) {
					rows.push({ type: 'multi', groups: smallGroupSequence });
					i = j;
				} else {
					rows.push({ type: 'single', groups: smallGroupSequence });
					i++;
				}
			} else {
				rows.push({ type: 'single', groups: [{ key: currentKey, options: currentOptions }] });
				i++;
			}
		}
		layoutRows = rows; // Update the $state variable
	});

	// Debounced function to check content height
	const debouncedCheckContentHeight = (() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let lastCheckTime = 0;
		let lastContentHeight = 0;
		let lastContainerHeight = 0;
		let checkCount = 0;
		const MIN_CHECK_INTERVAL = 300; // Increased minimum time between checks
		const MAX_CHECKS_PER_CYCLE = 3; // Maximum number of checks in a short period

		return () => {
			// Clear any pending timeout
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			// Check if we've run this too recently or too many times
			const now = Date.now();
			if (now - lastCheckTime < MIN_CHECK_INTERVAL) {
				// Increment check count for this cycle
				checkCount++;

				// If we've checked too many times in a short period, back off
				if (checkCount > MAX_CHECKS_PER_CYCLE) {
					console.debug('Too many content height checks, backing off');
					// Reset after a longer delay
					setTimeout(() => {
						checkCount = 0;
					}, 1000);
					return;
				}

				// Schedule a check after the minimum interval has passed
				timeoutId = setTimeout(() => {
					debouncedCheckContentHeight();
				}, MIN_CHECK_INTERVAL);
				return;
			}

			// Reset check count if enough time has passed
			if (now - lastCheckTime > 1000) {
				checkCount = 0;
			}

			// Set a timeout to perform the actual check
			timeoutId = setTimeout(() => {
				if (!panelElement) return;
				const panelContent = panelElement.querySelector('.panel-content');
				if (!panelContent) return;

				// Get current dimensions
				const contentHeight = panelContent.scrollHeight;
				const containerHeight = panelElement.clientHeight;

				// Skip check if dimensions haven't changed significantly
				if (
					Math.abs(contentHeight - lastContentHeight) < 2 &&
					Math.abs(containerHeight - lastContainerHeight) < 2
				) {
					timeoutId = null;
					return;
				}

				// Record that we're performing a check
				lastCheckTime = Date.now();
				lastContentHeight = contentHeight;
				lastContainerHeight = containerHeight;

				// Simplified check: scrollHeight includes content's own padding.
				// Compare directly with container's clientHeight.
				const buffer = 10; // Small buffer to prevent flickering
				const fits = contentHeight + buffer <= containerHeight;

				// Only update state if the value has actually changed
				if (fits !== contentIsShort) {
					contentIsShort = fits; // Update $state variable
					if (import.meta.env.DEV) {
						console.debug('OptionsPanel content fits:', fits, {
							contentHeight,
							containerHeight,
							buffer
						});
					}
				}
				timeoutId = null;
			}, 100); // Debounce delay
		};
	})();

	// Effect to check content height when options length changes
	// This prevents infinite loops by only triggering on meaningful changes
	let previousOptionsLength = -1;
	let previousOptionsKey = '';

	$effect(() => {
		// Skip if we don't have the necessary elements
		if (!options || !panelElement) return;

		// Create a key based on options length and transitionKey to detect meaningful changes
		const optionsKey = `${options.length}-${transitionKey}`;

		// Only run when options length or transitionKey actually changes
		if (options.length !== previousOptionsLength || optionsKey !== previousOptionsKey) {
			previousOptionsLength = options.length;
			previousOptionsKey = optionsKey;

			// Use a longer timeout to ensure DOM is fully updated
			// This helps prevent cascading updates that can cause infinite loops
			setTimeout(() => {
				// Only run if component is still mounted
				if (panelElement) {
					debouncedCheckContentHeight();
				}
			}, 150);
		}
	});

	// Effect for initial readiness and content height check
	onMount(() => {
		// Use a longer timeout for initial render to ensure DOM is fully ready
		// This helps prevent cascading updates during initial load
		let initialCheckTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
			// Only proceed if component is still mounted
			if (panelElement) {
				debouncedCheckContentHeight();
				// Set ready state after a small delay to ensure smooth transition
				setTimeout(() => {
					isReady = true; // Update $state variable
				}, 50);
			}
			initialCheckTimeout = null;
		}, 200); // Longer delay for initial render

		// Cleanup function
		return () => {
			if (initialCheckTimeout) {
				clearTimeout(initialCheckTimeout);
			}
		};
	});
</script>

<div
	class="options-panel"
	class:ready={isReady}
	bind:this={panelElement}
	use:resize={debouncedCheckContentHeight}
	class:vertically-center={contentIsShort}
	role="tabpanel"
	aria-labelledby="tab-{selectedTab}"
	id="options-panel-{selectedTab}"
	onscroll={handleScroll}
>
	<div class="panel-content">
		{#each layoutRows as row, rowIndex (transitionKey + '-row-' + rowIndex)}
			{#if row.type === 'single'}
				{#each row.groups as group (transitionKey + '-group-' + group.key)}
					<SectionHeader groupKey={group.key} isFirstHeader={rowIndex === 0} />
					<OptionGroupGrid options={group.options} key={transitionKey + '-optgroup-' + group.key} />
				{/each}
			{:else if row.type === 'multi'}
				<div class="multi-group-row" use:setupMultiGroupRow>
					{#each row.groups as group, groupIndex (transitionKey + '-multi-' + group.key)}
						<div class="multi-group-item" data-group-index={groupIndex}>
							<SectionHeader
								groupKey={group.key}
								isFirstHeader={rowIndex === 0 && groupIndex === 0}
							/>
							<OptionGroupGrid
								options={group.options}
								key={transitionKey + '-multiopt-' + group.key}
							/>
						</div>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.options-panel {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow-y: auto; /* Allows vertical scrolling */
		overflow-x: hidden; /* Prevents horizontal scrolling */
		box-sizing: border-box;
		display: flex; /* Using flex to help with centering logic */
		flex-direction: column;
		/* justify-content: flex-start; Default, but explicit for scrollable content */
		opacity: 0;
		transition: opacity 0.2s ease-out;
	}

	.options-panel.ready {
		opacity: 1;
	}

	.panel-content {
		width: 100%;
		padding: 0.5rem 0; /* Consistent padding, includes 0.5rem top and bottom */
		display: flex;
		flex-direction: column;
		align-items: center;
		/* min-height: fit-content; /* Ensures it takes at least the height of its content */
		/* flex-grow: 1; /* Allows panel-content to grow if options-panel is taller and not vertically centered */
	}

	/* When content is short, center it. panel-content itself is absolutely positioned. */
	.options-panel.vertically-center {
		justify-content: center; /* Center .panel-content if it's smaller than .options-panel */
	}
	.options-panel.vertically-center .panel-content {
		position: absolute; /* Detach from flow for centering */
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		/* Padding is already 0.5rem 0 from its own rule, no need to override here unless different */
		/* max-height: 100%; /* Ensure it doesn't overflow its centered container */
	}

	/* REMOVED THIS RULE: This was the primary cause of the scrolling issue.
	   By applying padding-top here, it was added *inside* the scrollable area.
	*/
	/*
	.options-panel:not(.vertically-center) .panel-content {
		padding-top: 20px;
	}
	*/

	.multi-group-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-evenly;
		align-items: flex-start;
		width: 100%;
		background-color: rgba(0, 0, 0, 0.01);
		gap: 0.25rem;
	}

	.multi-group-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 140px;
		flex: 1;
		margin: 0.25rem;
		padding: 0.25rem;
		border-radius: 12px;
		transition: all 0.2s ease-out; /* Smooth transition when forcing to new row */
	}

	/* Force an item to a new row when it would cause overflow */
	.multi-group-item.force-new-row {
		width: 100%; /* Take full width on the new row */
		flex-basis: 100%; /* Ensure it takes the full row */
		margin-top: 0.5rem; /* Add extra margin to separate from the row above */
		box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.1); /* Subtle separator */
	}

	@media (max-width: 640px) {
		.multi-group-row {
			gap: 0.1rem;
		}
		.multi-group-item {
			min-width: 100px;
			margin: 0.1rem;
			padding: 0.1rem;
		}
	}

	@media (max-width: 380px) {
		.multi-group-item {
			min-width: 80px;
		}
	}

	.options-panel {
		scrollbar-width: thin;
		scrollbar-color: rgba(100, 116, 139, 0.7) rgba(30, 41, 59, 0.1);
	}

	.options-panel::-webkit-scrollbar {
		width: 10px;
	}

	.options-panel::-webkit-scrollbar-track {
		background: rgba(30, 41, 59, 0.1);
		border-radius: 6px;
		margin: 2px 0;
	}

	.options-panel::-webkit-scrollbar-thumb {
		background-color: rgba(100, 116, 139, 0.7);
		border-radius: 6px;
		border: 2px solid transparent;
		background-clip: padding-box;
	}

	.options-panel::-webkit-scrollbar-thumb:hover {
		background-color: rgba(148, 163, 184, 0.9);
	}
</style>
