<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { LayoutProvider } from './layout';
	import OptionPickerHeader from './components/OptionPickerHeader';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	import { optionPickerState } from './optionPickerState.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { SortMethod } from './config';
	import { getSorter, determineGroupKey, getSortedGroupKeys } from './services/OptionsService';
	import transitionLoading from '$lib/state/stores/ui/transitionLoadingStore.svelte';

	// Start Position Picker imports
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import LoadingSpinner from '$lib/components/MainWidget/loading/LoadingSpinner.svelte';
	import { pictographData } from '$lib/state/pictograph/pictographDataState.svelte';
	import { browser } from '$app/environment';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import SvgManager from '$lib/components/SvgManager/SvgManager';

	// Determine which mode to show based on sequence state
	let isSequenceEmpty = $derived(sequenceState.isEmpty);
	let showStartPositionPicker = $derived(isSequenceEmpty);

	// Start Position Picker state (only used when sequence is empty)
	let gridMode = 'diamond';
	let startPositionPictographs = $state<PictographData[]>([]);
	let filteredDataAvailable = $state(false);
	let dataInitializationChecked = $state(false);
	let isStartPosLoading = $state(true);
	let startPosLoadingError = $state(false);
	let initialDataTimeout: number | null = null;

	let isLoading = $derived(
		showStartPositionPicker ? isStartPosLoading : optionPickerState.isLoading
	);

	let selectedTab = $derived.by(() => {
		const currentSortMethod = optionPickerState.sortMethod;
		const currentLastSelectedTab = optionPickerState.lastSelectedTab;

		return currentSortMethod === 'all' ? 'all' : currentLastSelectedTab[currentSortMethod] || 'all';
	});

	let rawOptions = $derived(optionPickerState.options);
	let sortMethod = $derived(optionPickerState.sortMethod);
	let sequence = $derived(optionPickerState.sequence);

	let filteredOptions = $derived.by(() => {
		let options = [...rawOptions];

		if (sortMethod !== 'all') {
			options.sort(getSorter(sortMethod as SortMethod, sequence));
		} else {
			options.sort((a, b) => (a.letter ?? '').localeCompare(b.letter ?? ''));
		}
		return options;
	});

	let groupedOptions = $derived.by(() => {
		if (sortMethod === 'all') {
			return {};
		}

		const groups: Record<string, PictographData[]> = {};
		filteredOptions.forEach((option) => {
			const groupKey = determineGroupKey(option, sortMethod as SortMethod, sequence);
			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(option);
		});

		const sortedKeys = getSortedGroupKeys(Object.keys(groups), sortMethod as SortMethod);
		const sortedGroups: Record<string, PictographData[]> = {};
		sortedKeys.forEach((key) => {
			if (groups[key]) {
				sortedGroups[key] = groups[key];
			}
		});
		return sortedGroups;
	});

	let actualCategoryKeys = $derived(groupedOptions ? Object.keys(groupedOptions) : []);
	let showTabs = $derived(sortMethod !== 'all' && actualCategoryKeys.length > 0);

	// Start Position Picker reactive effect for data loading with preloading
	$effect(() => {
		if (showStartPositionPicker) {
			const isInitialized = pictographData.isInitialized;
			const isPictographLoading = pictographData.isLoading;
			const data = pictographData.data;

			if (isInitialized && data && data.length > 0) {
				dataInitializationChecked = true;

				const defaultStartPosKeys =
					gridMode === 'diamond'
						? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
						: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

				const filteredPictographs = data.filter(
					(entry) =>
						entry.redMotionData &&
						entry.blueMotionData &&
						defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`)
				);

				// Preload all SVG components before showing pictographs
				preloadStartPositionSvgs(filteredPictographs)
					.then(() => {
						startPositionPictographs = filteredPictographs;
						filteredDataAvailable = filteredPictographs.length > 0;
						isStartPosLoading = false;
						if (initialDataTimeout) clearTimeout(initialDataTimeout);
					})
					.catch((error: unknown) => {
						console.warn('OptionPicker: SVG preloading failed, showing pictographs anyway:', error);
						// Show pictographs even if preloading fails
						startPositionPictographs = filteredPictographs;
						filteredDataAvailable = filteredPictographs.length > 0;
						isStartPosLoading = false;
						if (initialDataTimeout) clearTimeout(initialDataTimeout);
					});
			} else if (dataInitializationChecked && !isPictographLoading) {
				// Only set empty state if we've checked and we're not loading
				startPositionPictographs = [];
				filteredDataAvailable = false;
				isStartPosLoading = false;
			}
		}
	});

	let debugTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (debugTimer) clearTimeout(debugTimer);

		return () => {
			if (debugTimer) clearTimeout(debugTimer);
		};
	});

	let displayOptions = $derived.by(() => {
		const currentFilteredOptions = filteredOptions;
		const currentSelectedTab = selectedTab;
		const currentGroupedOptions = groupedOptions;
		const currentSortMethod = sortMethod;

		let result;
		if (currentSortMethod === 'all' || currentSelectedTab === 'all') {
			result = currentFilteredOptions;
		} else {
			result =
				(currentSelectedTab &&
					currentGroupedOptions &&
					currentGroupedOptions[currentSelectedTab]) ||
				[];
		}

		return result;
	});

	let loadingClearTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (!isLoading && displayOptions && displayOptions.length > 0) {
			if (loadingClearTimer) clearTimeout(loadingClearTimer);

			loadingClearTimer = setTimeout(() => {
				untrack(() => {
					transitionLoading.end();
				});
			}, 50);
		}

		return () => {
			if (loadingClearTimer) clearTimeout(loadingClearTimer);
		};
	});

	const loadOptionsFromSequence = async () => {
		try {
			// Use the correct method name from optionPickerState
			await optionPickerState.refreshOptionsFromCurrentSequence();
		} catch (error) {
			console.error('OptionPicker: Error in loadOptionsFromSequence:', error);
		}
	};

	async function handleOptionSelect(option: PictographData) {
		try {
			await optionPickerState.selectOption(option);
		} catch (error) {
			console.error('OptionPicker: Error handling option selection:', error);
		}
	}

	// Start Position Picker preloading function
	async function preloadStartPositionSvgs(pictographs: PictographData[]): Promise<void> {
		if (!browser || pictographs.length === 0) return;

		try {
			const svgManager = new SvgManager();
			const arrowConfigs: Array<{
				motionType: any;
				startOri: any;
				turns: any;
				color: any;
			}> = [];
			const propConfigs: Array<{
				propType: any;
				color: any;
			}> = [];

			// Collect all SVG configurations from start position pictographs
			pictographs.forEach((pictograph) => {
				// Collect arrow configurations
				if (pictograph.redMotionData) {
					arrowConfigs.push({
						motionType: pictograph.redMotionData.motionType,
						startOri: pictograph.redMotionData.startOri,
						turns: pictograph.redMotionData.turns,
						color: 'red'
					});
				}
				if (pictograph.blueMotionData) {
					arrowConfigs.push({
						motionType: pictograph.blueMotionData.motionType,
						startOri: pictograph.blueMotionData.startOri,
						turns: pictograph.blueMotionData.turns,
						color: 'blue'
					});
				}

				// Collect prop configurations (if any)
				if (pictograph.redPropData) {
					propConfigs.push({
						propType: pictograph.redPropData.propType,
						color: 'red'
					});
				}
				if (pictograph.bluePropData) {
					propConfigs.push({
						propType: pictograph.bluePropData.propType,
						color: 'blue'
					});
				}
			});

			// Preload all SVGs in parallel
			await Promise.all([
				arrowConfigs.length > 0 ? svgManager.preloadArrowSvgs(arrowConfigs) : Promise.resolve(),
				propConfigs.length > 0 ? svgManager.preloadPropSvgs(propConfigs) : Promise.resolve()
			]);

			console.debug('OptionPicker: Successfully preloaded start position SVGs:', {
				arrows: arrowConfigs.length,
				props: propConfigs.length
			});
		} catch (error) {
			console.warn('OptionPicker: SVG preloading failed:', error);
			throw error; // Re-throw to trigger fallback behavior
		}
	}

	// Start Position Picker helper functions
	function safeCopyPictographData(data: PictographData): PictographData {
		const safeCopy: PictographData = {
			letter: data.letter,
			startPos: data.startPos,
			endPos: data.endPos,
			timing: data.timing,
			direction: data.direction,
			gridMode: data.gridMode,
			grid: data.grid,
			gridData: data.gridData,
			redMotionData: data.redMotionData ? { ...data.redMotionData } : null,
			blueMotionData: data.blueMotionData ? { ...data.blueMotionData } : null,
			redPropData: data.redPropData,
			bluePropData: data.bluePropData,
			redArrowData: data.redArrowData,
			blueArrowData: data.blueArrowData,
			isStartPosition: data.isStartPosition
		};
		return safeCopy;
	}

	function handleStartPosClick(event: CustomEvent) {
		if (event.detail?.immediate) {
			isStartPosLoading = true;
			dataInitializationChecked = false;
			startPosLoadingError = false;
		}
		hapticFeedbackService.trigger('selection');
	}

	const handleStartPositionSelect = async (startPosPictograph: PictographData) => {
		try {
			// Provide haptic feedback when selecting a start position
			if (browser) {
				hapticFeedbackService.trigger('selection');
			}

			// Create a safe copy of the start position data
			const startPosCopy = safeCopyPictographData(startPosPictograph);
			startPosCopy.isStartPosition = true;

			// Ensure motion data is set to static for start positions
			if (startPosCopy.redMotionData) {
				startPosCopy.redMotionData.motionType = 'static';
				startPosCopy.redMotionData.endLoc = startPosCopy.redMotionData.startLoc;
				startPosCopy.redMotionData.endOri = startPosCopy.redMotionData.startOri;
				startPosCopy.redMotionData.turns = 0;
			}
			if (startPosCopy.blueMotionData) {
				startPosCopy.blueMotionData.motionType = 'static';
				startPosCopy.blueMotionData.endLoc = startPosCopy.blueMotionData.startLoc;
				startPosCopy.blueMotionData.endOri = startPosCopy.blueMotionData.startOri;
				startPosCopy.blueMotionData.turns = 0;
			}

			// Use the modern sequence state to set the start position
			await sequenceState.setStartPosition(startPosCopy);

			if (browser) {
				// Dispatch event for backward compatibility with existing components
				const customEvent = new CustomEvent('start-position-selected', {
					detail: {
						startPosition: startPosCopy,
						isTransitioning: false // No transition needed since we're in the same component
					},
					bubbles: true
				});

				document.dispatchEvent(customEvent);

				// Provide success haptic feedback when the start position is successfully set
				hapticFeedbackService.trigger('success');
			}
		} catch (error) {
			console.error('OptionPicker: Error setting start position:', error);
		}
	};

	onMount(() => {
		optionPickerState.initializeReactiveEffects();

		if (optionPickerState.sortMethod === 'all' && selectedTab !== 'all') {
			untrack(() => {
				optionPickerState.setLastSelectedTabForSort('all', 'all');
			});
		}

		// Start Position Picker initialization
		document.addEventListener('start-position-click', handleStartPosClick as EventListener);

		// Async initialization for start position data
		const initializePictographData = async () => {
			if (showStartPositionPicker) {
				// Check if pictograph data is already initialized
				if (!pictographData.isInitialized && !pictographData.isLoading) {
					// Wait for pictograph data to be initialized
					const initialized = await pictographData.waitForInitialization(10000);
					if (!initialized) {
						console.error('OptionPicker: Pictograph data initialization timeout');
						startPosLoadingError = true;
						isStartPosLoading = false;
					}
				}
			}
		};

		// Start the async initialization
		initializePictographData();

		initialDataTimeout = window.setTimeout(() => {
			if (isStartPosLoading && !dataInitializationChecked) {
				console.warn('OptionPicker: Start position data initialization timeout after 5 seconds');
				isStartPosLoading = false;
				startPosLoadingError = true;
			}
		}, 5000);

		const initializeSequence = async () => {
			if (!sequenceState.startPosition && !sequenceState.isLoading) {
				await sequenceState.loadSequence();
			}

			setTimeout(() => {
				loadOptionsFromSequence();
			}, 100);
		};

		initializeSequence();

		const handleSequenceUpdate = () => {
			loadOptionsFromSequence();
		};

		const handleRefreshOptions = async (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail?.startPosition) {
				await optionPickerState.loadOptions([customEvent.detail.startPosition]);
			} else {
				await loadOptionsFromSequence();
			}
		};

		const handleStartPositionSelected = async (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail?.startPosition) {
				await optionPickerState.loadOptions([customEvent.detail.startPosition]);
			}
		};

		const handleBeatAdded = () => {
			loadOptionsFromSequence();
		};

		const handleTabSelected = (event: CustomEvent) => {
			if (event.detail?.sortMethod && event.detail?.tabKey) {
				untrack(() => {
					optionPickerState.setLastSelectedTabForSort(event.detail.sortMethod, event.detail.tabKey);
				});
			}
		};

		const handleDirectTabSelect = (event: CustomEvent<string>) => {
			const currentSortMethod = optionPickerState.sortMethod;

			untrack(() => {
				optionPickerState.setLastSelectedTabForSort(currentSortMethod, event.detail);
			});
		};

		const handleForceUpdateTabs = (event: CustomEvent) => {
			if (event.detail?.sortMethod) {
				const sortMethod = event.detail.sortMethod;

				untrack(() => {
					optionPickerState.setSortMethod(sortMethod);
				});

				setTimeout(() => {
					const currentGroupedOptions = optionPickerState.groupedOptions;

					if (currentGroupedOptions && Object.keys(currentGroupedOptions).length > 0) {
					}
				}, 0);
			}
		};

		const handleShowAllView = () => {
			setTimeout(() => {
				untrack(() => {
					if (optionPickerState.sortMethod !== 'all') {
						optionPickerState.setSortMethod('all');
					}
				});
			}, 0);
		};

		const handleResetOptionPicker = () => {
			untrack(() => {
				optionPickerState.reset();
				transitionLoading.end();
			});
		};

		document.addEventListener('sequence-updated', handleSequenceUpdate);
		document.addEventListener('refresh-options', handleRefreshOptions);
		document.addEventListener('start-position-selected', handleStartPositionSelected);
		document.addEventListener('beat-added', handleBeatAdded as EventListener);
		document.addEventListener('option-picker-tab-selected', handleTabSelected as EventListener);
		document.addEventListener('direct-tab-select', handleDirectTabSelect as EventListener);
		document.addEventListener('force-update-tabs', handleForceUpdateTabs as EventListener);
		document.addEventListener('show-all-view', handleShowAllView as EventListener);
		document.addEventListener('reset-option-picker', handleResetOptionPicker);

		return () => {
			document.removeEventListener('sequence-updated', handleSequenceUpdate);
			document.removeEventListener('refresh-options', handleRefreshOptions);
			document.removeEventListener('start-position-selected', handleStartPositionSelected);
			document.removeEventListener('beat-added', handleBeatAdded as EventListener);
			document.removeEventListener(
				'option-picker-tab-selected',
				handleTabSelected as EventListener
			);
			document.removeEventListener('direct-tab-select', handleDirectTabSelect as EventListener);
			document.removeEventListener('force-update-tabs', handleForceUpdateTabs as EventListener);
			document.removeEventListener('show-all-view', handleShowAllView as EventListener);
			document.removeEventListener('reset-option-picker', handleResetOptionPicker);

			// Start Position Picker cleanup
			document.removeEventListener('start-position-click', handleStartPosClick as EventListener);
			if (initialDataTimeout) {
				clearTimeout(initialDataTimeout);
			}
		};
	});
</script>

<div class="option-picker" class:mobile={false} class:portrait={false}>
	{#if showStartPositionPicker}
		<!-- Start Position Picker Mode -->
		<div class="start-pos-picker">
			{#if isStartPosLoading}
				<div class="loading-container">
					<LoadingSpinner size="large" />
					<p class="loading-text">Loading Start Positions...</p>
				</div>
			{:else if startPosLoadingError}
				<div class="error-container">
					<p>Unable to load start positions. Please try refreshing the page.</p>
					<button
						onclick={() => {
							if (browser) window.location.reload();
						}}>Refresh</button
					>
				</div>
			{:else if !filteredDataAvailable}
				<div class="error-container">
					<p>No valid start positions found for the current configuration.</p>
				</div>
			{:else}
				<div class="pictograph-row">
					{#each startPositionPictographs as pictograph (pictograph.letter + '_' + pictograph.startPos + '_' + pictograph.endPos)}
						<div
							class="pictograph-container"
							role="button"
							tabindex="0"
							onclick={() => {
								handleStartPositionSelect(pictograph);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleStartPositionSelect(pictograph);
								}
							}}
						>
							<Pictograph
								pictographData={pictograph}
								showLoadingIndicator={false}
								debug={false}
								disableAnimations={true}
								animationDuration={0}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Option Picker Mode -->
		<LayoutProvider>
			<OptionPickerHeader {selectedTab} categoryKeys={actualCategoryKeys} {showTabs} />

			<div class="options-container">
				<OptionDisplayArea
					{isLoading}
					{selectedTab}
					optionsToDisplay={displayOptions}
					hasCategories={actualCategoryKeys.length > 0}
					onoptionselect={handleOptionSelect}
				/>
			</div>
		</LayoutProvider>
	{/if}
</div>

<style>
	.option-picker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
		background-color: transparent; /* Or your desired background */
		justify-content: center; /* Center content vertically */
	}

	.options-container {
		flex: 1; /* Takes remaining vertical space */
		display: flex; /* Needed for children */
		position: relative; /* For absolute positioning of children like messages */
		border-radius: 8px;
		background-color: transparent; /* Or your desired background */
		min-height: 0; /* Crucial for flex child sizing */
		overflow: hidden; /* Contains children, prevents double scrollbars */
		justify-content: center; /* Center content vertically */
	}
	/* Start Position Picker Styles */
	.start-pos-picker {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		min-height: 300px;
		padding: 20px 0;
		position: relative;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		flex: 1;
	}

	.loading-text {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
		animation: pulse 1.5s infinite ease-in-out;
	}

	@keyframes pulse {
		0% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.6;
		}
	}

	.error-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		text-align: center;
		padding: 20px;
	}

	.error-container p {
		margin-bottom: 20px;
		font-size: 1.1rem;
		color: #666;
	}

	.error-container button {
		padding: 10px 20px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 1rem;
	}

	.error-container button:hover {
		background-color: #0056b3;
	}

	.pictograph-row {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 20px;
		width: 100%;
		max-width: 800px;

		/* Default to row layout for landscape orientation */
		flex-direction: row;
		flex-wrap: wrap;
	}

	/* Portrait orientation: stack vertically */
	@media (orientation: portrait) {
		.pictograph-row {
			flex-direction: column;
			flex-wrap: nowrap;
			max-width: 300px; /* Narrower max width for portrait */
			gap: 16px; /* Slightly smaller gap for vertical layout */
		}
	}

	/* Landscape orientation: arrange horizontally */
	@media (orientation: landscape) {
		.pictograph-row {
			flex-direction: row;
			flex-wrap: wrap;
			max-width: 800px; /* Wider max width for landscape */
			gap: 20px;
		}
	}

	/* Small screens in landscape: still use row but with smaller gaps */
	@media (orientation: landscape) and (max-height: 500px) {
		.pictograph-row {
			gap: 16px;
			max-width: 600px;
		}
	}

	/* Very small screens: force column layout regardless of orientation */
	@media (max-width: 480px) {
		.pictograph-row {
			flex-direction: column;
			flex-wrap: nowrap;
			max-width: 280px;
			gap: 12px;
		}
	}

	.pictograph-container {
		cursor: pointer;
		border-radius: 8px;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		padding: 10px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid transparent;

		/* Responsive sizing */
		flex: 0 0 auto; /* Don't grow or shrink, maintain natural size */
		min-width: 120px; /* Minimum touch target size */
		min-height: 120px;
	}

	.pictograph-container:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		border-color: rgba(255, 204, 0, 0.5);
	}

	.pictograph-container:focus {
		outline: none;
		border-color: #ffcc00;
		box-shadow: 0 0 0 3px rgba(255, 204, 0, 0.3);
	}

	/* Portrait orientation: optimize for vertical stacking */
	@media (orientation: portrait) {
		.pictograph-container {
			width: 100%;
			max-width: 200px; /* Limit width in portrait */
			min-height: 140px; /* Slightly taller for better proportions */
		}
	}

	/* Landscape orientation: optimize for horizontal layout */
	@media (orientation: landscape) {
		.pictograph-container {
			flex: 1 1 auto; /* Allow containers to grow equally in landscape */
			max-width: 180px; /* Prevent containers from getting too wide */
			min-width: 140px;
		}
	}

	/* Small landscape screens: smaller containers */
	@media (orientation: landscape) and (max-height: 500px) {
		.pictograph-container {
			min-width: 120px;
			min-height: 100px;
			max-width: 150px;
			padding: 8px;
		}
	}

	/* Very small screens: compact containers */
	@media (max-width: 480px) {
		.pictograph-container {
			min-width: 100px;
			min-height: 100px;
			max-width: 160px;
			padding: 8px;
		}
	}

	/* Optional: Constrain max width on large screens */
	@media (min-width: 1400px) {
		.option-picker {
			max-width: 1400px;
			margin: 0 auto;
		}
	}
</style>
