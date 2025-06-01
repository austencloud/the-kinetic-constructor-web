<!--
  Modern Option Picker - Main Entry Point
  Nuclear rebuild with modern Svelte 5 architecture
  Replaces the legacy OptionPicker implementation
-->

<script lang="ts">
	import { getContext } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import ModernOptionPickerContainer from './components/containers/ModernOptionPickerContainer.svelte';

	// Props interface - maintains compatibility with legacy OptionPicker
	interface Props {
		// External integration callbacks
		onStartPositionSelected?: (position: PictographData) => void;
		onOptionSelected?: (option: PictographData) => void;
		onSequenceChanged?: () => void;

		// Configuration options
		maxOptions?: number;
		enableFiltering?: boolean;
		enableSorting?: boolean;
		enableValidation?: boolean;

		// Layout configuration
		containerWidth?: number;
		containerHeight?: number;

		// Behavior options
		autoLoadPositions?: boolean;
		showPreview?: boolean;

		// Legacy compatibility (deprecated but supported)
		selectedTab?: string;
		showTabs?: boolean;
		categoryKeys?: string[];
	}

	const {
		onStartPositionSelected,
		onOptionSelected,
		onSequenceChanged,
		maxOptions = 1000,
		enableFiltering = true,
		enableSorting = true,
		enableValidation = true,
		containerWidth,
		containerHeight,
		autoLoadPositions = true,
		showPreview = false,
		// Legacy props (ignored in modern implementation)
		selectedTab,
		showTabs,
		categoryKeys
	}: Props = $props();

	// Get SequenceService from context using the new getter pattern
	const getSequenceService = getContext<() => ISequenceService | null>('sequenceService');
	const sequenceService = $derived(getSequenceService?.() || null);

	if (!getSequenceService) {
		throw new Error(
			'ModernOptionPicker: SequenceService getter not found in context. Make sure ModernServiceProvider is wrapping this component.'
		);
	}

	// Container reference for API access
	let containerRef: any;

	// Event handlers that maintain legacy compatibility
	function handleStartPositionSelected(position: PictographData) {
		console.log('ModernOptionPicker: Start position selected:', position.letter);

		if (onStartPositionSelected) {
			onStartPositionSelected(position);
		}
	}

	function handleOptionSelected(option: PictographData) {
		console.log('ModernOptionPicker: Option selected:', option.letter);

		if (onOptionSelected) {
			onOptionSelected(option);
		}
	}

	function handleSequenceChanged() {
		console.log('ModernOptionPicker: Sequence changed');

		if (onSequenceChanged) {
			onSequenceChanged();
		}
	}

	// Legacy compatibility warnings
	$effect(() => {
		if (selectedTab !== undefined || showTabs !== undefined || categoryKeys !== undefined) {
			console.warn(
				'ModernOptionPicker: Legacy props (selectedTab, showTabs, categoryKeys) are deprecated and ignored in the modern implementation. Use filtering and sorting options instead.'
			);
		}
	});

	// Public API for external access (maintains legacy compatibility)
	export const api = {
		// Modern API
		clearSequence: () => containerRef?.api?.clearSequence(),
		refreshOptions: () => containerRef?.api?.refreshOptions(),
		loadPositions: () => containerRef?.api?.loadPositions(),
		getSelectedPosition: () => containerRef?.api?.getSelectedPosition(),
		getSelectedOptions: () => containerRef?.api?.getSelectedOptions(),
		clearError: () => containerRef?.api?.clearError(),

		// Legacy API compatibility (mapped to modern equivalents)
		refresh: () => containerRef?.api?.refreshOptions(),
		reset: () => containerRef?.api?.clearSequence(),
		getCurrentSelection: () => containerRef?.api?.getSelectedOptions(),

		// State access
		get isLoading() {
			return false; // Modern implementation handles loading internally
		},

		get hasError() {
			return false; // Modern implementation handles errors internally
		}
	};
</script>

<!-- Modern Option Picker -->
<div class="modern-option-picker" role="main" aria-label="Modern Option Picker">
	<!-- Migration Notice (temporary, for development) -->
	{#if import.meta.env.DEV}
		<div class="migration-notice" role="banner">
			<div class="notice-content">
				<span class="notice-icon">🚀</span>
				<span class="notice-text">Modern OptionPicker (Nuclear Rebuild)</span>
				<span class="notice-version">v2.0</span>
			</div>
		</div>
	{/if}

	<!-- Main Container -->
	<ModernOptionPickerContainer
		bind:this={containerRef}
		onStartPositionSelected={handleStartPositionSelected}
		onOptionSelected={handleOptionSelected}
		onSequenceChanged={handleSequenceChanged}
		{maxOptions}
		{enableFiltering}
		{enableSorting}
		{containerWidth}
		{containerHeight}
		{autoLoadPositions}
		{enableValidation}
	/>
</div>

<style>
	.modern-option-picker {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--modern-option-picker-background, #f8fafc);
		border-radius: var(--modern-option-picker-radius, 12px);
		overflow: hidden;
		position: relative;
	}

	/* Migration Notice (development only) */
	.migration-notice {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1001;
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.notice-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		justify-content: center;
	}

	.notice-icon {
		font-size: 1rem;
	}

	.notice-text {
		font-weight: 600;
	}

	.notice-version {
		background: rgba(255, 255, 255, 0.2);
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* Adjust main content when notice is present */
	:global(.modern-option-picker:has(.migration-notice) .modern-option-picker-container) {
		margin-top: 2.5rem;
		height: calc(100% - 2.5rem);
	}

	/* CSS Custom Properties for theming */
	.modern-option-picker {
		/* Container */
		--container-background: #ffffff;
		--container-radius: 8px;
		--container-padding: 1rem;

		/* Header */
		--header-background: #f9fafb;
		--header-padding: 1rem;

		/* Footer */
		--footer-background: #f9fafb;
		--footer-padding: 1rem;

		/* Colors */
		--primary-color: #3b82f6;
		--secondary-color: #6b7280;
		--success-color: #10b981;
		--warning-color: #f59e0b;
		--error-color: #ef4444;

		/* Text */
		--text-primary: #374151;
		--text-secondary: #4b5563;
		--text-muted: #6b7280;

		/* Borders */
		--border-color: #e5e7eb;
		--border-radius: 6px;

		/* Shadows */
		--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

		/* Focus */
		--focus-color: #3b82f6;
		--focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.1);

		/* Transitions */
		--transition-fast: 150ms ease;
		--transition-normal: 250ms ease;
		--transition-slow: 350ms ease;

		/* Grid */
		--grid-gap: 0.5rem;
		--grid-padding: 1rem;
		--cell-gap: 0.5rem;

		/* Option Cards */
		--option-card-background: #ffffff;
		--option-card-border: #e2e8f0;
		--option-card-radius: 8px;
		--option-card-selected: #3b82f6;
		--option-card-selected-background: #eff6ff;
		--option-card-hover-border: #cbd5e1;
		--option-card-highlighted: #f59e0b;
		--option-card-highlighted-background: #fffbeb;

		/* Hover Effects */
		--option-hover-scale: 1.05;
		--option-selected-scale: 1.02;
		--option-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

		/* Buttons */
		--button-background: #ffffff;
		--button-border: #d1d5db;
		--button-text: #374151;
		--button-hover-background: #f9fafb;
		--button-hover-border: #9ca3af;
		--button-secondary-background: #3b82f6;
		--button-secondary-border: #3b82f6;
		--button-secondary-text: #ffffff;
		--button-secondary-hover-background: #2563eb;
		--button-secondary-hover-border: #2563eb;

		/* Error States */
		--error-background: #fef2f2;
		--error-border: #fecaca;
		--error-text: #dc2626;

		/* Loading States */
		--loading-background: rgba(255, 255, 255, 0.9);
		--loading-spinner: #3b82f6;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.modern-option-picker {
			--container-background: #1f2937;
			--header-background: #111827;
			--footer-background: #111827;
			--text-primary: #f9fafb;
			--text-secondary: #e5e7eb;
			--text-muted: #9ca3af;
			--border-color: #374151;
			--option-card-background: #374151;
			--option-card-border: #4b5563;
			--button-background: #374151;
			--button-border: #4b5563;
			--button-text: #f9fafb;
			--button-hover-background: #4b5563;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.modern-option-picker {
			--border-color: #000000;
			--option-card-border: #000000;
			--button-border: #000000;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.modern-option-picker {
			--transition-fast: none;
			--transition-normal: none;
			--transition-slow: none;
			--option-hover-scale: 1;
			--option-selected-scale: 1;
		}
	}
</style>
