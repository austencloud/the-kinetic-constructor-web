<!--
  Modern Option Grid - Pure Presentation Component
  Displays option grid with virtual scrolling and accessibility
-->

<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import type { GridLayout } from '../../services/core/ILayoutService';
	import OptionCard from './OptionCard.svelte';

	// Props interface using Svelte 5 runes
	interface Props {
		// Data
		options: PictographData[];
		selectedOptions?: string[];

		// Layout
		gridLayout: GridLayout;
		virtualScrolling?: boolean;

		// State
		isLoading?: boolean;
		error?: string | null;

		// Events
		onOptionClick: (option: PictographData) => void;
		onOptionDoubleClick?: (option: PictographData) => void;
		onOptionHover?: (option: PictographData | null) => void;
	}

	const {
		options,
		selectedOptions = [],
		gridLayout,
		virtualScrolling = false,
		isLoading = false,
		error = null,
		onOptionClick,
		onOptionDoubleClick,
		onOptionHover
	}: Props = $props();

	// Derived values
	const hasOptions = $derived(options.length > 0);
	const isEmpty = $derived(!isLoading && !hasOptions && !error);
	const visibleOptions = $derived(virtualScrolling ? getVisibleOptions() : options);

	// Virtual scrolling state
	let scrollContainer: HTMLDivElement = $state() as HTMLDivElement;
	let scrollTop = $state(0);
	let containerHeight = $state(0);

	// Virtual scrolling calculations
	function getVisibleOptions(): PictographData[] {
		if (!virtualScrolling || !containerHeight) return options;

		const itemHeight = gridLayout.cellSize + gridLayout.gap;
		const itemsPerRow = gridLayout.columns;
		const rowHeight = itemHeight;

		const startRow = Math.floor(scrollTop / rowHeight);
		const endRow = Math.min(
			Math.ceil((scrollTop + containerHeight) / rowHeight) + 1,
			Math.ceil(options.length / itemsPerRow)
		);

		const startIndex = startRow * itemsPerRow;
		const endIndex = Math.min(endRow * itemsPerRow, options.length);

		return options.slice(startIndex, endIndex);
	}

	// Event handlers
	function handleOptionClick(option: PictographData) {
		onOptionClick(option);
	}

	function handleOptionDoubleClick(option: PictographData) {
		if (onOptionDoubleClick) {
			onOptionDoubleClick(option);
		}
	}

	function handleOptionHover(option: PictographData | null) {
		if (onOptionHover) {
			onOptionHover(option);
		}
	}

	function isOptionSelected(option: PictographData): boolean {
		const optionId = `${option.letter ?? 'unknown'}-${option.startPos ?? 'unknown'}`;
		return selectedOptions.includes(optionId);
	}

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	// Keyboard navigation
	function handleKeyDown(event: KeyboardEvent) {
		if (!hasOptions) return;

		const currentIndex = options.findIndex((option) => isOptionSelected(option));
		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowRight':
				event.preventDefault();
				newIndex = Math.min(currentIndex + 1, options.length - 1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				newIndex = Math.max(currentIndex - 1, 0);
				break;
			case 'ArrowDown':
				event.preventDefault();
				newIndex = Math.min(currentIndex + gridLayout.columns, options.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				newIndex = Math.max(currentIndex - gridLayout.columns, 0);
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = options.length - 1;
				break;
		}

		if (newIndex !== currentIndex && newIndex >= 0) {
			handleOptionClick(options[newIndex]);
		}
	}

	// Resize observer for virtual scrolling
	$effect(() => {
		if (!scrollContainer || !virtualScrolling) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerHeight = entry.contentRect.height;
			}
		});

		resizeObserver.observe(scrollContainer);

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<!-- Option Grid Container -->
<div
	class="modern-option-grid"
	role="grid"
	aria-label="Option selection grid"
	aria-busy={isLoading}
	onkeydown={handleKeyDown}
	tabindex="0"
>
	<!-- Loading State -->
	{#if isLoading}
		<div class="option-grid__loading" role="status" aria-live="polite">
			<div class="loading-spinner" aria-hidden="true"></div>
			<span class="loading-text">Loading options...</span>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="option-grid__error" role="alert" aria-live="assertive">
			<div class="error-icon" aria-hidden="true">⚠️</div>
			<div class="error-message">
				<h3>Error Loading Options</h3>
				<p>{error}</p>
			</div>
		</div>
	{/if}

	<!-- Empty State -->
	{#if isEmpty}
		<div class="option-grid__empty" role="status">
			<div class="empty-icon" aria-hidden="true">🎯</div>
			<div class="empty-message">
				<h3>No Options Available</h3>
				<p>Select a start position to see available options.</p>
			</div>
		</div>
	{/if}

	<!-- Option Grid -->
	{#if hasOptions && !isLoading && !error}
		<div
			class="option-grid__container"
			class:option-grid__container--virtual={virtualScrolling}
			bind:this={scrollContainer}
			onscroll={virtualScrolling ? handleScroll : undefined}
		>
			{#if virtualScrolling}
				<!-- Virtual scrolling spacer -->
				<div
					class="option-grid__spacer"
					style:height="{Math.ceil(options.length / gridLayout.columns) *
						(gridLayout.cellSize + gridLayout.gap)}px"
				></div>
			{/if}

			<div
				class="option-grid__grid"
				style:grid-template-columns="repeat({gridLayout.columns}, 1fr)"
				style:gap="{gridLayout.gap}px"
				style:--cell-size="{gridLayout.cellSize}px"
				style:transform={virtualScrolling
					? `translateY(${Math.floor(scrollTop / (gridLayout.cellSize + gridLayout.gap)) * (gridLayout.cellSize + gridLayout.gap)}px)`
					: 'none'}
				role="grid"
				aria-rowcount={Math.ceil(options.length / gridLayout.columns)}
				aria-colcount={gridLayout.columns}
			>
				{#each visibleOptions as option, index ((option.letter ?? 'unknown') + (option.startPos ?? 'unknown'))}
					{@const globalIndex = virtualScrolling ? options.indexOf(option) : index}
					{@const rowIndex = Math.floor(globalIndex / gridLayout.columns)}
					{@const colIndex = globalIndex % gridLayout.columns}

					<div
						class="option-card-wrapper"
						role="gridcell"
						aria-rowindex={rowIndex + 1}
						aria-colindex={colIndex + 1}
					>
						<OptionCard
							{option}
							isSelected={isOptionSelected(option)}
							size={gridLayout.cellSize <= 80
								? 'small'
								: gridLayout.cellSize >= 160
									? 'large'
									: 'medium'}
							onClick={() => handleOptionClick(option)}
							onDoubleClick={() => handleOptionDoubleClick(option)}
							onHover={(isHovering) => handleOptionHover(isHovering ? option : null)}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Grid Info (for screen readers) -->
	<div class="sr-only" aria-live="polite">
		{#if hasOptions}
			{options.length} options available in {Math.ceil(options.length / gridLayout.columns)} rows.
			{#if selectedOptions.length > 0}
				{selectedOptions.length} option{selectedOptions.length === 1 ? '' : 's'} selected.
			{:else}
				No options selected.
			{/if}
		{/if}
	</div>
</div>

<style>
	.modern-option-grid {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		outline: none;
		overflow: hidden;
	}

	.modern-option-grid:focus-visible {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: 2px;
		border-radius: 4px;
	}

	/* Grid Container */
	.option-grid__container {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.option-grid__container--virtual {
		overflow-y: auto;
		overflow-x: hidden;
	}

	.option-grid__spacer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.option-grid__grid {
		display: grid;
		justify-content: center;
		align-content: start;
		padding: var(--grid-padding, 1rem);
		position: relative;
	}

	.option-card-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Loading State */
	.option-grid__loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem 2rem;
		text-align: center;
		color: var(--text-muted, #6b7280);
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--border-color, #e5e7eb);
		border-top: 3px solid var(--primary-color, #3b82f6);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-text {
		font-size: 0.875rem;
		font-weight: 500;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Error State */
	.option-grid__error {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		margin: 1rem;
		background: var(--error-background, #fef2f2);
		border: 1px solid var(--error-border, #fecaca);
		border-radius: 8px;
		color: var(--error-text, #dc2626);
	}

	.error-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.error-message h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.error-message p {
		margin: 0;
		font-size: 0.875rem;
		opacity: 0.9;
	}

	/* Empty State */
	.option-grid__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--text-muted, #6b7280);
	}

	.empty-icon {
		font-size: 4rem;
		opacity: 0.5;
	}

	.empty-message h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #374151);
	}

	.empty-message p {
		margin: 0;
		font-size: 1rem;
		opacity: 0.8;
	}

	/* Screen reader only content */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.option-grid__grid {
			padding: var(--grid-padding-mobile, 0.75rem);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.option-grid__error {
			border-width: 2px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
		}

		.option-grid__grid {
			transition: none;
		}
	}
</style>
