<script lang="ts">
	import { fade, crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { untrack } from 'svelte';
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

	// Track if we've already preloaded SVGs for the current options
	let preloadedOptionsHash = $state('');
	let isPreloading = $state(false);
	let preloadingAttempts = $state(0);

	// Helper function to create a simple hash of options for comparison
	function createOptionsHash(options: PictographData[] | undefined): string {
		if (!options || options.length === 0) return '';

		// Create a simple hash based on the number of options and some properties of the first option
		const firstOption = options[0];
		const firstOptionHash = firstOption
			? `${firstOption.letter || ''}-${firstOption.gridMode || ''}-${firstOption.direction || ''}`
			: 'none';

		return `${options.length}-${firstOptionHash}`;
	}

	// Debounce the preloading effect with better controls
	let preloadTimer: ReturnType<typeof setTimeout> | undefined;

	// DISABLED: Use a more controlled approach to preloading
	// $effect(() => {
	// 	// Skip if already preloading or no options to display
	// 	if (isPreloading || !props.optionsToDisplay || props.optionsToDisplay.length === 0) return;
	//
	// 	// Skip if we've already preloaded these options
	// 	const currentHash = createOptionsHash(props.optionsToDisplay);
	// 	if (currentHash === preloadedOptionsHash) return;
	//
	// 	// Limit preloading attempts to prevent infinite loops
	// 	if (preloadingAttempts > 3) {
	// 		console.warn('OptionDisplayArea: Too many preloading attempts, skipping');
	// 		return;
	// 	}
	//
	// 	// Clear any existing timer
	// 	if (preloadTimer) {
	// 		clearTimeout(preloadTimer);
	// 		preloadTimer = undefined;
	// 	}
	//
	// 	// Use a longer debounce for better performance
	// 	preloadTimer = setTimeout(() => {
	// 		// Use untrack to prevent reactivity loops
	// 		untrack(() => {
	// 			// Skip if already preloading
	// 			if (isPreloading) return;
	//
	// 			isPreloading = true;
	// 			preloadingAttempts++;
	// 			preloadedOptionsHash = currentHash;
	//
	// 			// Execute preloading without storing the promise
	// 			preloadAllSvgsForOptions(props.optionsToDisplay || [])
	// 				.catch((error) => {
	// 					console.error('Error preloading SVGs:', error);
	// 				})
	// 				.finally(() => {
	// 					isPreloading = false;
	// 				});
	// 		});
	// 	}, 300); // Longer delay for better debouncing
	//
	// 	// Cleanup function
	// 	return () => {
	// 		if (preloadTimer) {
	// 			clearTimeout(preloadTimer);
	// 			preloadTimer = undefined;
	// 		}
	// 	};
	// });

	// Completely disable preloading to prevent reactivity loops
	console.log('OptionDisplayArea: Preloading disabled to prevent reactivity loops');

	/**
	 * DISABLED: Optimized function to preload all SVGs for options in parallel
	 * This significantly improves loading performance by preloading props and arrows simultaneously
	 */
	async function preloadAllSvgsForOptions(options: PictographData[]): Promise<void> {
		// Do nothing - completely disabled to prevent reactivity loops
		console.log('SVG preloading disabled to prevent reactivity loops');
		return Promise.resolve();
	}

	// DISABLED: Export the preload function for use by other components
	export function preloadPropsForOptions(options: PictographData[]): Promise<void> {
		// Do nothing - completely disabled to prevent reactivity loops
		console.log('SVG preloading disabled to prevent reactivity loops');
		return Promise.resolve();
	}

	/* ───────────── what we're going to show ───────────── */
	let hasOptions = $state(false);
	let displayState = $state<'loading' | 'empty' | 'options'>('loading');
	let messageText = $state('');

	// Simplify display state logic
	$effect(() => {
		untrack(() => {
			const options = Array.isArray(props.optionsToDisplay) ? props.optionsToDisplay : [];
			console.log('OptionDisplayArea: Options length:', options.length);

			hasOptions = options.length > 0;

			if (props.isLoading) {
				displayState = 'loading';
				messageText = 'Loading options...';
				console.log('OptionDisplayArea: Loading state');
			} else if (!hasOptions) {
				displayState = 'empty';
				const currentTab = String(props.selectedTab || '');
				const isShowAllView = !props.hasCategories || currentTab === 'all';

				messageText = isShowAllView
					? 'No options available for the current position.'
					: `No options available in the "${currentTab}" category.`;

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
