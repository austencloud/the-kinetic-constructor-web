<!--
  Modern Option Picker Container - Main Orchestrator Component
  Coordinates all OptionPicker functionality with modern Svelte 5 architecture
-->

<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import OptionServiceProvider from '../../services/OptionServiceProvider.svelte';
	import StartPositionContainer from './StartPositionContainer.svelte';
	import OptionContainer from './OptionContainer.svelte';

	// Props interface
	interface Props {
		// External integration
		onStartPositionSelected?: (position: PictographData) => void;
		onOptionSelected?: (option: PictographData) => void;
		onSequenceChanged?: () => void;

		// Configuration
		maxOptions?: number;
		enableFiltering?: boolean;
		enableSorting?: boolean;

		// Layout
		containerWidth?: number;
		containerHeight?: number;

		// Behavior
		autoLoadPositions?: boolean;
		enableValidation?: boolean;
	}

	const {
		onStartPositionSelected,
		onOptionSelected,
		onSequenceChanged,
		maxOptions = 1000,
		enableFiltering = true,
		enableSorting = true,
		containerWidth,
		containerHeight,
		autoLoadPositions = true,
		enableValidation = true
	}: Props = $props();

	// Get SequenceService from context (should be provided by parent)
	const sequenceServiceGetter = getContext<() => ISequenceService | null>('sequenceService');
	const sequenceService = sequenceServiceGetter?.() || null;

	if (!sequenceService) {
		console.warn(
			'OptionPickerContainer: SequenceService not found in context. Make sure to provide it in the parent component.'
		);
	}

	// Container state
	let containerElement: HTMLDivElement;
	let startPositionContainer = $state<any>(null);
	let optionContainer = $state<any>(null);
	let isInitialized = $state(false);
	let error = $state<string | null>(null);

	// Reactive state from SequenceService (with null safety)
	const currentSequence = $derived(sequenceService?.state.beats || []);
	const startPosition = $derived(sequenceService?.state.startPosition || null);
	const hasSequence = $derived(currentSequence.length > 0);

	// UI transition state - determines which picker to show
	const isEmpty = $derived(sequenceService?.isEmpty ?? true);
	const hasStartPosition = $derived(!!startPosition);
	const showStartPositionPicker = $derived(isEmpty);
	const showOptionPicker = $derived(!isEmpty && hasStartPosition);

	// Debug logging for UI transition state
	$effect(() => {
		if (import.meta.env.DEV) {
			console.log('🔄 OptionPickerContainer UI transition state:', {
				isEmpty,
				hasStartPosition,
				startPositionLetter: startPosition?.letter || 'null',
				showStartPositionPicker,
				showOptionPicker,
				beatCount: currentSequence.length
			});
		}
	});

	// Event handlers
	function handleStartPositionSelected(position: PictographData) {
		try {
			console.log('OptionPickerContainer: Start position selected:', position.letter);

			// Notify parent component
			if (onStartPositionSelected) {
				onStartPositionSelected(position);
			}

			// The service integration will automatically load options
			// No need to manually trigger option loading here
		} catch (error) {
			console.error('OptionPickerContainer: Error handling start position selection:', error);
			setError('Failed to select start position');
		}
	}

	function handleOptionSelected(option: PictographData) {
		try {
			console.log('OptionPickerContainer: Option selected:', option.letter);

			// Notify parent component
			if (onOptionSelected) {
				onOptionSelected(option);
			}

			// Notify sequence changed
			if (onSequenceChanged) {
				onSequenceChanged();
			}
		} catch (error) {
			console.error('OptionPickerContainer: Error handling option selection:', error);
			setError('Failed to select option');
		}
	}

	function handleSequenceChanged() {
		try {
			console.log('OptionPickerContainer: Sequence changed, beats:', currentSequence.length);

			// Notify parent component
			if (onSequenceChanged) {
				onSequenceChanged();
			}
		} catch (error) {
			console.error('OptionPickerContainer: Error handling sequence change:', error);
			setError('Failed to handle sequence change');
		}
	}

	// Error handling
	function setError(message: string) {
		error = message;

		// Clear error after 5 seconds
		setTimeout(() => {
			error = null;
		}, 5000);
	}

	function clearError() {
		error = null;
	}

	// Container management
	function handleContainerResize() {
		if (containerElement && (containerWidth || containerHeight)) {
			const rect = containerElement.getBoundingClientRect();

			// Update container dimensions if not provided as props
			if (!containerWidth || !containerHeight) {
				// The layout service will handle this through the individual containers
			}
		}
	}

	// Set up resize observer
	$effect(() => {
		if (!containerElement) return;

		const resizeObserver = new ResizeObserver(() => {
			handleContainerResize();
		});

		resizeObserver.observe(containerElement);
		handleContainerResize(); // Initial size

		return () => {
			resizeObserver.disconnect();
		};
	});

	// Set up SequenceService event listeners (with null safety)
	$effect(() => {
		if (!sequenceService) return;

		const unsubscribeBeatAdded = sequenceService.on('beat:added', (data) => {
			console.log('OptionPickerContainer: Beat added to sequence:', data.beat.id);
			handleSequenceChanged();
		});

		const unsubscribeStartPositionChanged = sequenceService.on('startPosition:changed', (data) => {
			console.log(
				'OptionPickerContainer: Start position changed:',
				data.startPosition?.letter || 'cleared'
			);
		});

		const unsubscribeSequenceCleared = sequenceService.on('sequence:cleared', () => {
			console.log('OptionPickerContainer: Sequence cleared');
			handleSequenceChanged();
		});

		return () => {
			unsubscribeBeatAdded();
			unsubscribeStartPositionChanged();
			unsubscribeSequenceCleared();
		};
	});

	// Initialize container
	onMount(() => {
		try {
			console.log('OptionPickerContainer: Initializing...');
			isInitialized = true;
			console.log('OptionPickerContainer: Initialization complete');
		} catch (error) {
			console.error('OptionPickerContainer: Initialization error:', error);
			setError('Failed to initialize OptionPicker');
		}
	});

	// Expose API for parent components
	export const api = {
		clearSequence: () => sequenceService?.clearSequence(),
		refreshOptions: () => optionContainer?.api?.refreshOptions(),
		loadPositions: () => startPositionContainer?.api?.loadPositions(),
		getSelectedPosition: () => startPositionContainer?.api?.getSelectedPosition(),
		getSelectedOptions: () => optionContainer?.api?.getSelectedOptions(),
		clearError
	};
</script>

<!-- Modern Option Picker Container -->
<div
	class="modern-option-picker-container"
	class:modern-option-picker-container--initialized={isInitialized}
	bind:this={containerElement}
	role="application"
	aria-label="Option Picker"
	style:width={containerWidth ? `${containerWidth}px` : '100%'}
	style:height={containerHeight ? `${containerHeight}px` : '100%'}
>
	<!-- Error Display -->
	{#if error}
		<div class="error-banner" role="alert" aria-live="assertive">
			<div class="error-content">
				<span class="error-icon" aria-hidden="true">⚠️</span>
				<span class="error-message">{error}</span>
				<button class="error-dismiss" onclick={clearError} aria-label="Dismiss error"> ✕ </button>
			</div>
		</div>
	{/if}

	{#if sequenceService}
		<!-- Service Provider Wrapper -->
		<OptionServiceProvider {sequenceService}>
			{#snippet children()}
				<!-- Conditional UI based on sequence state -->
				{#if showStartPositionPicker}
					<!-- Start Position Selection Mode -->
					<div class="start-position-mode" role="main" aria-label="Start Position Selection">
						<StartPositionContainer
							bind:this={startPositionContainer}
							onPositionSelected={handleStartPositionSelected}
							{enableValidation}
							autoLoad={autoLoadPositions}
							showPreview={false}
						/>
					</div>
				{:else if showOptionPicker}
					<!-- Option Selection Mode -->
					<div class="option-selection-mode" role="main" aria-label="Option Selection">
						<OptionContainer
							bind:this={optionContainer}
							{sequenceService}
							onOptionSelected={handleOptionSelected}
							onSequenceChanged={handleSequenceChanged}
							{enableFiltering}
							{enableSorting}
							{maxOptions}
						/>
					</div>
				{:else}
					<!-- Fallback state (should not normally occur) -->
					<div class="fallback-state" role="status" aria-live="polite">
						<div class="fallback-content">
							<div class="fallback-icon" aria-hidden="true">🔄</div>
							<h3>Preparing Interface...</h3>
							<p>Setting up the option picker interface.</p>
						</div>
					</div>
				{/if}
			{/snippet}
		</OptionServiceProvider>

		<!-- Loading Overlay (during initialization) -->
		{#if !isInitialized}
			<div class="loading-overlay" role="status" aria-live="polite">
				<div class="loading-content">
					<div class="loading-spinner" aria-hidden="true"></div>
					<span class="loading-text">Initializing Option Picker...</span>
				</div>
			</div>
		{/if}
	{:else}
		<div class="service-not-available">
			<p>SequenceService not available. Please check service initialization.</p>
		</div>
	{/if}
</div>

<style>
	.modern-option-picker-container {
		position: relative;
		width: 100%;
		height: 100%;
		background: var(--option-picker-background, #f8fafc);
		border-radius: var(--option-picker-radius, 12px);
		overflow: hidden;
		transition: opacity 0.3s ease;
	}

	.modern-option-picker-container:not(.modern-option-picker-container--initialized) {
		opacity: 0.7;
	}

	/* Error Banner */
	.error-banner {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: var(--error-background, #fef2f2);
		border-bottom: 1px solid var(--error-border, #fecaca);
		padding: 0.75rem 1rem;
	}

	.error-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		max-width: 100%;
	}

	.error-icon {
		flex-shrink: 0;
		font-size: 1.125rem;
	}

	.error-message {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--error-text, #dc2626);
	}

	.error-dismiss {
		flex-shrink: 0;
		background: none;
		border: none;
		font-size: 1rem;
		color: var(--error-text, #dc2626);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 2px;
		transition: background-color 0.2s ease;
	}

	.error-dismiss:hover {
		background: rgba(220, 38, 38, 0.1);
	}

	/* Main Layout Modes */
	.start-position-mode,
	.option-selection-mode {
		height: 100%;
		width: 100%;
		background: var(--section-background, #ffffff);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.start-position-mode {
		/* Full height for start position selection */
		padding: 1rem;
	}

	.option-selection-mode {
		/* Full height for option selection */
		padding: 0;
	}

	/* Fallback State */
	.fallback-state {
		height: 100%;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--section-background, #ffffff);
	}

	.fallback-content {
		text-align: center;
		padding: 2rem;
		max-width: 400px;
	}

	.fallback-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.6;
	}

	.fallback-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1f2937);
	}

	.fallback-content p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-muted, #6b7280);
		line-height: 1.5;
	}

	/* Loading Overlay */
	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
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
		color: var(--text-muted, #6b7280);
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.start-position-mode {
			padding: 0.75rem;
		}

		.fallback-content {
			padding: 1.5rem;
		}

		.fallback-icon {
			font-size: 2.5rem;
		}
	}

	@media (max-width: 480px) {
		.modern-option-picker-container {
			border-radius: 8px;
		}

		.start-position-mode {
			padding: 0.5rem;
		}

		.fallback-content {
			padding: 1rem;
		}

		.fallback-content h3 {
			font-size: 1.125rem;
		}

		.fallback-icon {
			font-size: 2rem;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.start-position-mode,
		.option-selection-mode,
		.fallback-state {
			border: 1px solid var(--border-color, #e5e7eb);
		}

		.error-banner {
			border-bottom-width: 2px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.modern-option-picker-container {
			transition: none;
		}

		.loading-spinner {
			animation: none;
		}
	}
</style>
