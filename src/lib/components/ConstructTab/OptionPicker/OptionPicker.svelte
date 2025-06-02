<!--
  Main OptionPicker Component - Entry Point
  Exports the OptionPickerContainer as the main component
-->

<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import OptionPickerContainer from './components/containers/OptionPickerContainer.svelte';

	// Props interface - matches the container interface
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
		showPreview?: boolean;

		// Legacy props (for backward compatibility)
		selectedTab?: string | null;
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
		containerWidth,
		containerHeight,
		autoLoadPositions = true,
		enableValidation = true,
		showPreview = false,
		// Legacy props are ignored in modern implementation
		selectedTab,
		showTabs,
		categoryKeys
	}: Props = $props();
</script>

<!-- Main OptionPicker Container -->
<OptionPickerContainer
	{onStartPositionSelected}
	{onOptionSelected}
	{onSequenceChanged}
	{maxOptions}
	{enableFiltering}
	{enableSorting}
	{containerWidth}
	{containerHeight}
	{autoLoadPositions}
	{enableValidation}
/>
