<!--
  Modern Start Position Picker - Pure Presentation Component
  Displays start position grid with proper accessibility and interaction
-->

<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import OptionCard from './OptionCard.svelte';

	// Props interface using Svelte 5 runes
	interface Props {
		// Data
		startPositions: PictographData[];
		selectedPosition: PictographData | null;

		// State
		isLoading?: boolean;
		error?: string | null;

		// Layout
		gridColumns?: number;
		cellSize?: number;
		showDetails?: boolean;

		// Events
		onPositionClick: (position: PictographData) => void;
		onPositionHover?: (position: PictographData | null) => void;
	}

	const {
		startPositions,
		selectedPosition,
		isLoading = false,
		error = null,
		gridColumns = 4,
		cellSize = 120,
		showDetails = false,
		onPositionClick,
		onPositionHover
	}: Props = $props();

	// Derived values
	const hasPositions = $derived(startPositions.length > 0);
	const isEmpty = $derived(!isLoading && !hasPositions && !error);

	// Event handlers
	function handlePositionClick(position: PictographData) {
		onPositionClick(position);
	}

	function handlePositionHover(position: PictographData | null) {
		if (onPositionHover) {
			onPositionHover(position);
		}
	}

	function isPositionSelected(position: PictographData): boolean {
		if (!selectedPosition) return false;
		return (
			selectedPosition.letter === position.letter && selectedPosition.endPos === position.endPos
		);
	}

	// Keyboard navigation
	function handleKeyDown(event: KeyboardEvent) {
		if (!hasPositions) return;

		const currentIndex = selectedPosition
			? startPositions.findIndex((pos) => isPositionSelected(pos))
			: -1;

		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowRight':
				event.preventDefault();
				newIndex = Math.min(currentIndex + 1, startPositions.length - 1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				newIndex = Math.max(currentIndex - 1, 0);
				break;
			case 'ArrowDown':
				event.preventDefault();
				newIndex = Math.min(currentIndex + gridColumns, startPositions.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				newIndex = Math.max(currentIndex - gridColumns, 0);
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = startPositions.length - 1;
				break;
		}

		if (newIndex !== currentIndex && newIndex >= 0) {
			handlePositionClick(startPositions[newIndex]);
		}
	}
</script>

<!-- Start Position Picker Container -->
<div
	class="modern-start-position-picker"
	role="grid"
	aria-label="Start position selection"
	aria-busy={isLoading}
	onkeydown={handleKeyDown}
	tabindex="0"
>
	<!-- Loading State -->
	{#if isLoading}
		<div class="start-position-picker__loading" role="status" aria-live="polite">
			<div class="loading-spinner" aria-hidden="true"></div>
			<span class="loading-text">Loading start positions...</span>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="start-position-picker__error" role="alert" aria-live="assertive">
			<div class="error-icon" aria-hidden="true">⚠️</div>
			<div class="error-message">
				<h3>Error Loading Start Positions</h3>
				<p>{error}</p>
			</div>
		</div>
	{/if}

	<!-- Empty State -->
	{#if isEmpty}
		<div class="start-position-picker__empty" role="status">
			<div class="empty-icon" aria-hidden="true">📍</div>
			<div class="empty-message">
				<h3>No Start Positions Available</h3>
				<p>Start positions will appear here when data is loaded.</p>
			</div>
		</div>
	{/if}

	<!-- Position Grid -->
	{#if hasPositions && !isLoading && !error}
		<div
			class="start-position-picker__grid"
			style:grid-template-columns="repeat({gridColumns}, 1fr)"
			style:--cell-size="{cellSize}px"
			role="grid"
			aria-rowcount={Math.ceil(startPositions.length / gridColumns)}
			aria-colcount={gridColumns}
		>
			{#each startPositions as position, index ((position.letter ?? '') + position.endPos)}
				{@const rowIndex = Math.floor(index / gridColumns)}
				{@const colIndex = index % gridColumns}

				<div
					class="position-card-wrapper"
					role="gridcell"
					aria-rowindex={rowIndex + 1}
					aria-colindex={colIndex + 1}
				>
					<OptionCard
						option={position}
						isSelected={isPositionSelected(position)}
						size={cellSize <= 80 ? 'small' : cellSize >= 160 ? 'large' : 'medium'}
						{showDetails}
						onClick={() => handlePositionClick(position)}
						onHover={(isHovering) => handlePositionHover(isHovering ? position : null)}
					/>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Grid Info (for screen readers) -->
	<div class="sr-only" aria-live="polite">
		{#if hasPositions}
			{startPositions.length} start positions available.
			{#if selectedPosition}
				Currently selected: {selectedPosition.letter || 'unknown'} at position {selectedPosition.endPos ||
					'unknown'}.
			{:else}
				No position selected.
			{/if}
		{/if}
	</div>
</div>

<style>
	.modern-start-position-picker {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap, 1rem);
		padding: var(--container-padding, 1rem);
		outline: none;
	}

	.modern-start-position-picker:focus-visible {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: 2px;
		border-radius: 4px;
	}

	/* Grid Layout */
	.start-position-picker__grid {
		display: grid;
		gap: var(--cell-gap, 0.5rem);
		justify-content: center;
		align-content: start;
		width: 100%;
		height: fit-content;
	}

	.position-card-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Loading State */
	.start-position-picker__loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
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
	.start-position-picker__error {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
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
	.start-position-picker__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem 2rem;
		text-align: center;
		color: var(--text-muted, #6b7280);
	}

	.empty-icon {
		font-size: 3rem;
		opacity: 0.5;
	}

	.empty-message h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #374151);
	}

	.empty-message p {
		margin: 0;
		font-size: 0.875rem;
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
		.modern-start-position-picker {
			padding: var(--container-padding-mobile, 0.75rem);
		}

		.start-position-picker__grid {
			gap: var(--cell-gap-mobile, 0.375rem);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.start-position-picker__error {
			border-width: 2px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
		}
	}
</style>
