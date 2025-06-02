<!--
  Start Position Container - Smart Container Component
  Manages start position business logic and integrates with services
-->

<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { IStartPositionService } from '../../services/core/IStartPositionService';
	import type { ILayoutService } from '../../services/core/ILayoutService';
	import { START_POSITION_SERVICE_KEY, LAYOUT_SERVICE_KEY } from '../../services/serviceKeys';
	import ModernStartPositionPicker from '../presentation/ModernStartPositionPicker.svelte';

	// Props interface
	interface Props {
		onPositionSelected?: (position: PictographData) => void;
		enableValidation?: boolean;
		showPreview?: boolean;
		autoLoad?: boolean;
	}

	const {
		onPositionSelected,
		enableValidation = true,
		showPreview = false,
		autoLoad = true
	}: Props = $props();

	// Service injection
	const startPositionService = getContext<IStartPositionService>(START_POSITION_SERVICE_KEY);
	const layoutService = getContext<ILayoutService>(LAYOUT_SERVICE_KEY);

	if (!startPositionService) {
		throw new Error('StartPositionContainer: StartPositionService not found in context');
	}
	if (!layoutService) {
		throw new Error('StartPositionContainer: LayoutService not found in context');
	}

	// Reactive state from services
	const availablePositions = $derived(startPositionService.availablePositions);
	const selectedPosition = $derived(startPositionService.selectedPosition);
	const isLoading = $derived(startPositionService.isLoading);
	const error = $derived(startPositionService.error);
	const hasPositions = $derived(startPositionService.hasPositions);

	// Layout state
	const gridLayout = $derived(layoutService.optimalGridLayout);
	const gridColumns = $derived(layoutService.gridColumns);
	const cellSize = $derived(layoutService.cellSize);

	// Container state
	let containerElement: HTMLDivElement;
	let containerWidth = $state(0);
	let containerHeight = $state(0);

	// Business logic methods
	async function loadPositions() {
		try {
			await startPositionService.loadPositions();

			if (enableValidation) {
				startPositionService.validateAllPositions();
			}
		} catch (error) {
			console.error('StartPositionContainer: Error loading positions:', error);
		}
	}

	function handlePositionSelect(position: PictographData) {
		try {
			// Validate position if validation is enabled
			if (enableValidation) {
				const validation = startPositionService.validatePosition(position);
				if (!validation.isValid) {
					console.warn('StartPositionContainer: Invalid position selected:', validation.errors);
					// Could show validation errors to user here
				}
			}

			// Select the position through the service
			startPositionService.selectPosition(position);

			// Notify parent component
			if (onPositionSelected) {
				onPositionSelected(position);
			}

			console.log('StartPositionContainer: Position selected:', position.letter);
		} catch (error) {
			console.error('StartPositionContainer: Error selecting position:', error);
		}
	}

	function handlePositionHover(position: PictographData | null) {
		// Could implement hover preview logic here
		if (showPreview && position) {
			console.log('StartPositionContainer: Hovering over position:', position.letter);
		}
	}

	// Container resize handling
	function updateContainerSize() {
		if (containerElement) {
			const rect = containerElement.getBoundingClientRect();
			containerWidth = rect.width;
			containerHeight = rect.height;

			// Update layout service with new container size
			layoutService.updateContainerSize(containerWidth, containerHeight);
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
		const unsubscribePositionSelected = startPositionService.on('position:selected', (data) => {
			console.log(
				'StartPositionContainer: Service event - position selected:',
				data.position.letter
			);
		});

		const unsubscribePositionsLoaded = startPositionService.on('positions:loaded', (data) => {
			console.log(
				'StartPositionContainer: Service event - positions loaded:',
				data.positions.length
			);

			// Update layout service with new item count
			layoutService.setItemCount(data.positions.length);
		});

		const unsubscribeValidationCompleted = startPositionService.on(
			'validation:completed',
			(data) => {
				console.log(
					'StartPositionContainer: Service event - validation completed:',
					data.results.size
				);
			}
		);

		const unsubscribeError = startPositionService.on('error', (data) => {
			console.error('StartPositionContainer: Service error:', data.error);
		});

		return () => {
			unsubscribePositionSelected();
			unsubscribePositionsLoaded();
			unsubscribeValidationCompleted();
			unsubscribeError();
		};
	});

	// Auto-load positions on mount
	onMount(async () => {
		if (autoLoad && !hasPositions && !isLoading) {
			await loadPositions();
		}
	});

	// Expose methods for parent components
	export const api = {
		loadPositions,
		clearPosition: () => startPositionService.clearPosition(),
		refreshPositions: () => startPositionService.refreshPositions(),
		getSelectedPosition: () => selectedPosition,
		getValidationResults: () => startPositionService.state.validationResults
	};
</script>

<!-- Start Position Container -->
<div
	class="start-position-container"
	bind:this={containerElement}
	role="region"
	aria-label="Start position selection"
>
	<!-- Header -->
	<div class="start-position-container__header">
		<h2 class="container-title">Select Start Position</h2>

		{#if hasPositions}
			<div class="position-count" aria-live="polite">
				{availablePositions.length} position{availablePositions.length === 1 ? '' : 's'} available
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="start-position-container__content">
		<ModernStartPositionPicker
			startPositions={availablePositions}
			{selectedPosition}
			{isLoading}
			{error}
			{gridColumns}
			{cellSize}
			showDetails={showPreview}
			onPositionClick={handlePositionSelect}
			onPositionHover={handlePositionHover}
		/>
	</div>

	<!-- Footer (if needed for actions) -->
	{#if selectedPosition}
		<div class="start-position-container__footer">
			<div class="selected-position-info">
				<span class="selected-label">Selected:</span>
				<span class="selected-value">
					{selectedPosition.letter || 'Unknown'}
					({selectedPosition.endPos || 'Unknown position'})
				</span>

				<button
					class="clear-button"
					onclick={() => startPositionService.clearPosition()}
					aria-label="Clear selected position"
				>
					Clear
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.start-position-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		background: var(--container-background, #ffffff);
		border-radius: var(--container-radius, 8px);
		overflow: hidden;
	}

	.start-position-container__header {
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

	.position-count {
		font-size: 0.875rem;
		color: var(--text-muted, #6b7280);
		font-weight: 500;
	}

	.start-position-container__content {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.start-position-container__footer {
		padding: var(--footer-padding, 1rem);
		border-top: 1px solid var(--border-color, #e5e7eb);
		background: var(--footer-background, #f9fafb);
	}

	.selected-position-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.selected-label {
		font-weight: 600;
		color: var(--text-primary, #374151);
	}

	.selected-value {
		color: var(--text-secondary, #4b5563);
		font-family: var(--font-mono, 'Courier New', monospace);
	}

	.clear-button {
		margin-left: auto;
		padding: 0.25rem 0.75rem;
		background: var(--button-secondary-background, #f3f4f6);
		border: 1px solid var(--button-secondary-border, #d1d5db);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--button-secondary-text, #374151);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-button:hover {
		background: var(--button-secondary-hover-background, #e5e7eb);
		border-color: var(--button-secondary-hover-border, #9ca3af);
	}

	.clear-button:focus-visible {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: 2px;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.start-position-container__header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.container-title {
			font-size: 1rem;
		}

		.position-count {
			font-size: 0.8125rem;
		}
	}
</style>
