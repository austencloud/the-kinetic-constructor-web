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
	import transitionLoading from '$lib/state/stores/ui/transitionLoadingStore';

	let isLoading = $derived(optionPickerState.isLoading);

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
			await optionPickerState.loadOptionsFromSequence();
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

	onMount(() => {
		optionPickerState.initializeReactiveEffects();

		if (optionPickerState.sortMethod === 'all' && selectedTab !== 'all') {
			untrack(() => {
				optionPickerState.setLastSelectedTabForSort('all', 'all');
			});
		}

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
		};
	});
</script>

<div class="option-picker" class:mobile={false} class:portrait={false}>
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
	/* Optional: Constrain max width on large screens */
	@media (min-width: 1400px) {
		.option-picker {
			max-width: 1400px;
			margin: 0 auto;
		}
	}
</style>
