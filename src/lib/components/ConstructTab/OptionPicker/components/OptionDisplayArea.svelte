<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { PictographData } from '$lib/types/PictographData';
	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel/OptionsPanel.svelte';
	import SvgManager from '$lib/components/SvgManager/SvgManager';
	import { PropType } from '$lib/types/Types';
	import type { Color, MotionType, Orientation, TKATurns } from '$lib/types/Types';
	import { preloadCommonArrows } from '$lib/utils/embeddedArrowSvgs';

	// Create a crossfade transition for smooth tab switching
	const [send, receive] = crossfade({
		duration: 350,
		easing: quintOut,
		fallback(node) {
			return fade(node, { duration: 300 });
		}
	});

	// Props using Svelte 5 runes
	const props = $props<{
		isLoading: boolean;
		selectedTab: string | null;
		optionsToDisplay?: PictographData[];
		hasCategories: boolean;
	}>();

	// Set default values
	$effect(() => {
		if (!props.optionsToDisplay) props.optionsToDisplay = [];
	});

	// Preload all SVGs when options change - use the optimized function
	$effect(() => {
		if (props.optionsToDisplay && props.optionsToDisplay.length > 0) {
			// Use the optimized function that preloads all SVGs in parallel
			preloadAllSvgsForOptions(props.optionsToDisplay);
		}
	});

	/**
	 * Optimized function to preload all SVGs for options in parallel
	 * This significantly improves loading performance by preloading props and arrows simultaneously
	 */
	async function preloadAllSvgsForOptions(options: PictographData[]) {
		if (typeof window === 'undefined' || !options || options.length === 0) return; // Skip in SSR or if no options

		// First, preload common embedded arrows (fastest, no network requests)
		preloadCommonArrows();

		// Extract unique prop configs from options
		const propConfigs: Array<{
			propType: PropType;
			color: Color;
		}> = [];

		// Extract unique arrow configs from options
		const arrowConfigs: Array<{
			motionType: MotionType;
			startOri: Orientation;
			turns: TKATurns;
			color: Color;
		}> = [];

		// Track which props and arrows we've already added to avoid duplicates
		const addedProps = new Set<string>();
		const addedArrows = new Set<string>();

		// Process all options
		options.forEach((option) => {
			// Add red prop if exists
			if (option.redPropData) {
				const key = `${option.redPropData.propType}-red`;
				if (!addedProps.has(key)) {
					propConfigs.push({
						propType: option.redPropData.propType,
						color: 'red'
					});
					addedProps.add(key);
				}
			}

			// Add blue prop if exists
			if (option.bluePropData) {
				const key = `${option.bluePropData.propType}-blue`;
				if (!addedProps.has(key)) {
					propConfigs.push({
						propType: option.bluePropData.propType,
						color: 'blue'
					});
					addedProps.add(key);
				}
			}

			// Add red arrow if exists
			if (option.redArrowData) {
				const key = `${option.redArrowData.motionType}-${option.redArrowData.startOri}-${option.redArrowData.turns}-red`;
				if (!addedArrows.has(key)) {
					arrowConfigs.push({
						motionType: option.redArrowData.motionType as MotionType,
						startOri: option.redArrowData.startOri as Orientation,
						turns: option.redArrowData.turns as TKATurns,
						color: 'red'
					});
					addedArrows.add(key);
				}
			}

			// Add blue arrow if exists
			if (option.blueArrowData) {
				const key = `${option.blueArrowData.motionType}-${option.blueArrowData.startOri}-${option.blueArrowData.turns}-blue`;
				if (!addedArrows.has(key)) {
					arrowConfigs.push({
						motionType: option.blueArrowData.motionType as MotionType,
						startOri: option.blueArrowData.startOri as Orientation,
						turns: option.blueArrowData.turns as TKATurns,
						color: 'blue'
					});
					addedArrows.add(key);
				}
			}
		});

		// Create a single SvgManager instance for all preloading
		const svgManager = new SvgManager();

		// Preload all SVGs in parallel for maximum performance
		try {
			// Start both preloading operations in parallel
			const preloadPromises = [
				// Preload props
				propConfigs.length > 0 ? svgManager.preloadPropSvgs(propConfigs) : Promise.resolve(),
				// Preload arrows
				arrowConfigs.length > 0 ? svgManager.preloadArrowSvgs(arrowConfigs) : Promise.resolve()
			];

			// Wait for all preloading to complete
			await Promise.all(preloadPromises);

			console.debug('OptionDisplayArea: Preloaded all SVGs for options:', {
				props: propConfigs.length,
				arrows: arrowConfigs.length
			});
		} catch (error) {
			console.warn('OptionDisplayArea: Error preloading SVGs:', error);
		}
	}

	// Legacy function for backward compatibility - kept for API compatibility with other components
	// @ts-ignore - This function is used by other components that haven't been updated yet
	async function preloadPropsForOptions(options: PictographData[]) {
		// Use the new optimized function instead
		await preloadAllSvgsForOptions(options);
	}

	// Preload all SVGs on mount - use the optimized function
	onMount(() => {
		if (props.optionsToDisplay && props.optionsToDisplay.length > 0) {
			// Use the optimized function that preloads all SVGs in parallel
			preloadAllSvgsForOptions(props.optionsToDisplay);
		}
	});

	/* ───────────── what we're going to show ───────────── */
	let hasOptions = $state(false);
	let displayState = $state<'loading' | 'empty' | 'options'>('loading');
	let messageText = $state('');

	// Update display state based on props
	$effect(() => {
		// Ensure optionsToDisplay is an array and log its length for debugging
		const options = Array.isArray(props.optionsToDisplay) ? props.optionsToDisplay : [];
		console.log('OptionDisplayArea: Options length:', options.length);

		// Update hasOptions - this is critical for determining whether to show options or an empty state
		hasOptions = options.length > 0;

		// Determine display state
		if (props.isLoading) {
			displayState = 'loading';
			messageText = 'Loading options...';
			console.log('OptionDisplayArea: Loading state');
		} else if (!hasOptions) {
			displayState = 'empty';

			// Set appropriate message text
			const currentTab = String(props.selectedTab || '');

			// Check if we're in "Show All" view
			const isShowAllView = !props.hasCategories || currentTab === 'all';

			if (isShowAllView) {
				// Generic message for "Show All" view
				messageText = 'No options available for the current position.';
			} else if (currentTab) {
				// Specific message for category tabs
				messageText = `No options available in the "${currentTab}" category.`;
			} else {
				// Fallback message
				messageText = 'No options available.';
			}

			// Debug logging
			console.log('OptionDisplayArea: Empty state with message:', {
				message: messageText,
				isShowAllView,
				currentTab,
				hasCategories: props.hasCategories,
				optionsLength: options.length
			});
		} else {
			displayState = 'options';
			console.log('OptionDisplayArea: Options state with', options.length, 'options');
		}
	});

	// Add a second effect to force a re-evaluation after a short delay
	// This helps with timing issues during initialization
	$effect(() => {
		if (typeof window !== 'undefined' && props.optionsToDisplay) {
			// Force a re-evaluation after a short delay to ensure we have the latest data
			setTimeout(() => {
				const options = Array.isArray(props.optionsToDisplay) ? props.optionsToDisplay : [];
				if (options.length > 0 && displayState === 'empty') {
					console.log('OptionDisplayArea: Forcing update from empty to options state');
					displayState = 'options';
					hasOptions = true;
				}
			}, 100);
		}
	});
</script>

<div class="display-wrapper">
	{#key props.selectedTab}
		{#if displayState === 'loading'}
			<div
				class="absolute-content"
				in:receive={{ key: `content-${props.selectedTab}-loading` }}
				out:send={{ key: `content-${props.selectedTab}-loading` }}
			>
				<LoadingMessage />
			</div>
		{:else if displayState === 'empty'}
			<div
				class="absolute-content"
				in:receive={{ key: `content-${props.selectedTab}-empty` }}
				out:send={{ key: `content-${props.selectedTab}-empty` }}
			>
				<EmptyMessage type="empty" message={messageText} />
			</div>
		{:else}
			<div
				class="absolute-content"
				in:receive={{ key: `content-${props.selectedTab}-options` }}
				out:send={{ key: `content-${props.selectedTab}-options` }}
			>
				<OptionsPanel
					options={props.optionsToDisplay}
					selectedTab={props.selectedTab}
					transitionKey={props.selectedTab}
				/>
			</div>
		{/if}
	{/key}
</div>

<style>
	.display-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.absolute-content {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
