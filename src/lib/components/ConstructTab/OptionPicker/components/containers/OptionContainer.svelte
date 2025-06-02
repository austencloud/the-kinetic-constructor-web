<!--
  Option Container - Smart Container Component
  Manages option selection business logic and integrates with services
-->

<script lang="ts">
	import { getContext } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import type {
		IOptionService,
		FilterCriteria,
		SortCriteria,
		OptionServiceEvents
	} from '../../services/core/IOptionService.js';
	import type { ILayoutService, GridLayout } from '../../services/core/ILayoutService.js';
	import { OPTION_SERVICE_KEY, LAYOUT_SERVICE_KEY } from '../../services/serviceKeys';
	import { createBeat } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
	import OptionGrid from '../presentation/OptionGrid.svelte';

	// Props interface
	interface Props {
		sequenceService: ISequenceService;
		onOptionSelected?: (option: PictographData) => void;
		onSequenceChanged?: () => void;
		enableFiltering?: boolean;
		enableSorting?: boolean;
		maxOptions?: number;
	}

	const {
		sequenceService,
		onOptionSelected,
		onSequenceChanged,
		enableFiltering = true,
		enableSorting = true,
		maxOptions = 1000
	}: Props = $props();

	// Service injection
	const optionService = getContext<IOptionService>(OPTION_SERVICE_KEY);
	const layoutService = getContext<ILayoutService>(LAYOUT_SERVICE_KEY);

	if (!optionService) {
		throw new Error('OptionContainer: OptionService not found in context');
	}
	if (!layoutService) {
		throw new Error('OptionContainer: LayoutService not found in context');
	}

	// Reactive state from services
	const availableOptions = $derived(optionService.availableOptions);
	const filteredOptions = $derived(optionService.filteredOptions);
	const selectedOptions = $derived(optionService.selectedOptions);
	const isLoading = $derived(optionService.isLoading);
	const error = $derived(optionService.error);
	const hasOptions = $derived(optionService.hasOptions);

	// Layout state
	const gridLayout = $derived(layoutService.optimalGridLayout);

	// Container state
	let containerElement: HTMLDivElement;
	let isSelectingOption = $state(false);

	// Business logic methods
	async function handleOptionSelect(option: PictographData) {
		if (isSelectingOption) {
			console.warn('OptionContainer: Already selecting option, skipping duplicate request');
			return;
		}

		isSelectingOption = true;

		try {
			console.log('OptionContainer: Selecting option:', option.letter);

			// Validate option
			if (!optionService.validateOption(option)) {
				throw new Error('Invalid option selected');
			}

			// Get the current beat count to determine the beat number
			const currentBeatCount = sequenceService.state.beats.length;

			// Create proper BeatData using the createBeat helper
			const beatData = createBeat(currentBeatCount + 1, option, {
				filled: true,
				duration: 1,
				tags: [`letter-${option.letter || 'unknown'}`]
			});

			// Add beat to sequence service
			sequenceService.addBeats([beatData]);

			// Update option service selection
			optionService.selectOption(option);

			// Notify parent component
			if (onOptionSelected) {
				onOptionSelected(option);
			}

			// Notify sequence changed
			if (onSequenceChanged) {
				onSequenceChanged();
			}

			console.log('OptionContainer: Option selection completed');
		} catch (error) {
			console.error('OptionContainer: Error handling option selection:', error);
		} finally {
			// Reset selection flag after a delay to prevent rapid successive calls
			setTimeout(() => {
				isSelectingOption = false;
			}, 200);
		}
	}

	function handleOptionDoubleClick(option: PictographData) {
		// Double-click could trigger different behavior
		console.log('OptionContainer: Option double-clicked:', option.letter);
		// For now, just treat as regular selection
		handleOptionSelect(option);
	}

	function handleOptionHover(option: PictographData | null) {
		// Could implement hover preview logic here
		if (option) {
			console.log('OptionContainer: Hovering over option:', option.letter);
		}
	}

	// Filtering and sorting methods
	function applyFilter(criteria: FilterCriteria) {
		if (!enableFiltering) return;

		optionService.filterOptions(criteria);
	}

	function applySort(criteria: SortCriteria) {
		if (!enableSorting) return;

		optionService.sortOptions(criteria);
	}

	function clearFilters() {
		if (!enableFiltering) return;

		optionService.clearFilters();
	}

	function clearSelection() {
		optionService.clearSelection();
	}

	// Container resize handling
	function updateContainerSize() {
		if (containerElement) {
			const rect = containerElement.getBoundingClientRect();
			layoutService.updateContainerSize(rect.width, rect.height);
		}
	}

	// Set up resize observer
	$effect(() => {
		if (!containerElement) return;

		const resizeObserver = new ResizeObserver(() => {
			updateContainerSize();
		});

		resizeObserver.observe(containerElement);
		updateContainerSize(); // Initial size

		return () => {
			resizeObserver.disconnect();
		};
	});

	// Set up service event listeners
	$effect(() => {
		const unsubscribeOptionSelected = optionService.on(
			'option:selected',
			(data: OptionServiceEvents['option:selected']) => {
				console.log('OptionContainer: Service event - option selected:', data.option.letter);
			}
		);

		const unsubscribeOptionsLoaded = optionService.on(
			'options:loaded',
			(data: OptionServiceEvents['options:loaded']) => {
				console.log('OptionContainer: Service event - options loaded:', data.options.length);

				// Update layout service with new item count
				layoutService.setItemCount(data.options.length);
			}
		);

		const unsubscribeOptionsFiltered = optionService.on(
			'options:filtered',
			(data: OptionServiceEvents['options:filtered']) => {
				console.log('OptionContainer: Service event - options filtered:', data.options.length);

				// Update layout service with filtered count
				layoutService.setItemCount(data.options.length);
			}
		);

		const unsubscribeError = optionService.on('error', (data: OptionServiceEvents['error']) => {
			console.error('OptionContainer: Service error:', data.error);
		});

		return () => {
			unsubscribeOptionSelected();
			unsubscribeOptionsLoaded();
			unsubscribeOptionsFiltered();
			unsubscribeError();
		};
	});

	// Create selected option IDs for the grid
	const selectedOptionIds = $derived(
		selectedOptions.map((option: PictographData) => `${option.letter}-${option.startPos}`)
	);

	// Expose methods for parent components
	export const api = {
		applyFilter,
		applySort,
		clearFilters,
		clearSelection,
		refreshOptions: () => optionService.refreshOptions(),
		getSelectedOptions: () => selectedOptions,
		getFilteredOptions: () => filteredOptions
	};
</script>

<!-- Option Container -->
<div
	class="option-container"
	bind:this={containerElement}
	role="region"
	aria-label="Option selection"
>
	<!-- Header -->
	<div class="option-container__header">
		<h2 class="container-title">Available Options</h2>

		{#if hasOptions}
			<div class="option-stats" aria-live="polite">
				{filteredOptions.length} of {availableOptions.length} option{filteredOptions.length === 1
					? ''
					: 's'}
				{#if selectedOptions.length > 0}
					• {selectedOptions.length} selected
				{/if}
			</div>
		{/if}
	</div>

	<!-- Controls (if filtering/sorting enabled) -->
	{#if (enableFiltering || enableSorting) && hasOptions}
		<div class="option-container__controls">
			{#if enableFiltering}
				<div class="filter-controls">
					<button class="control-button" onclick={clearFilters} disabled={!hasOptions}>
						Clear Filters
					</button>
				</div>
			{/if}

			{#if enableSorting}
				<div class="sort-controls">
					<select
						class="sort-select"
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							const value = target?.value;
							if (value) {
								const [field, direction] = value.split('-');
								applySort({ field: field as any, direction: direction as 'asc' | 'desc' });
							}
						}}
					>
						<option value="">Sort by...</option>
						<option value="letter-asc">Letter (A-Z)</option>
						<option value="letter-desc">Letter (Z-A)</option>
						<option value="type-asc">Type (A-Z)</option>
						<option value="endPosition-asc">End Position</option>
					</select>
				</div>
			{/if}

			{#if selectedOptions.length > 0}
				<div class="selection-controls">
					<button class="control-button control-button--secondary" onclick={clearSelection}>
						Clear Selection ({selectedOptions.length})
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Content -->
	<div class="option-container__content">
		<OptionGrid
			options={filteredOptions}
			selectedOptions={selectedOptionIds}
			{gridLayout}
			virtualScrolling={filteredOptions.length > 100}
			{isLoading}
			{error}
			onOptionClick={handleOptionSelect}
			onOptionDoubleClick={handleOptionDoubleClick}
			onOptionHover={handleOptionHover}
		/>
	</div>
</div>

<style>
	.option-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		background: var(--container-background, #ffffff);
		border-radius: var(--container-radius, 8px);
		overflow: hidden;
	}

	.option-container__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--header-padding, 1rem);
		border-bottom: 1px solid var(--border-color, #e5e7eb);
		background: var(--header-background, #f9fafb);
	}

	.container-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #374151);
	}

	.option-stats {
		font-size: 0.875rem;
		color: var(--text-muted, #6b7280);
		font-weight: 500;
	}

	.option-container__controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-color, #e5e7eb);
		background: var(--controls-background, #fafafa);
		flex-wrap: wrap;
	}

	.filter-controls,
	.sort-controls,
	.selection-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-button {
		padding: 0.375rem 0.75rem;
		background: var(--button-background, #ffffff);
		border: 1px solid var(--button-border, #d1d5db);
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--button-text, #374151);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.control-button:hover:not(:disabled) {
		background: var(--button-hover-background, #f9fafb);
		border-color: var(--button-hover-border, #9ca3af);
	}

	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.control-button--secondary {
		background: var(--button-secondary-background, #3b82f6);
		border-color: var(--button-secondary-border, #3b82f6);
		color: var(--button-secondary-text, #ffffff);
	}

	.control-button--secondary:hover:not(:disabled) {
		background: var(--button-secondary-hover-background, #2563eb);
		border-color: var(--button-secondary-hover-border, #2563eb);
	}

	.sort-select {
		padding: 0.375rem 0.75rem;
		background: var(--select-background, #ffffff);
		border: 1px solid var(--select-border, #d1d5db);
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--select-text, #374151);
		cursor: pointer;
	}

	.sort-select:focus {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: 2px;
	}

	.option-container__content {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.option-container__header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.option-container__controls {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.filter-controls,
		.sort-controls,
		.selection-controls {
			justify-content: space-between;
		}

		.container-title {
			font-size: 1rem;
		}

		.option-stats {
			font-size: 0.8125rem;
		}
	}
</style>
