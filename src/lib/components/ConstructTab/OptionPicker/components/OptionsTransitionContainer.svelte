<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { prefersReducedMotion } from '../utils/a11y';

	// Props using Svelte 5 runes
	const {
		options = [],
		transitionDuration = 300,
		panel
	} = $props<{
		options?: PictographData[];
		transitionDuration?: number;
		panel: import('svelte').Snippet<[{ options: PictographData[]; key: string }]>;
	}>();

	// Internal state using Svelte 5 runes
	let previousOptions = $state<PictographData[]>([]);
	let currentOptions = $state<PictographData[]>([]);
	let isTransitioning = $state(false);
	let transitionKey = $state(0);
	let transitionTimeout: ReturnType<typeof setTimeout> | null = null;

	// Add option set tracking to prevent excessive transitions
	let lastOptionIds = '';
	let initialized = false;

	// Shallow comparison function for option arrays
	function getOptionsSignature(opts: PictographData[]): string {
		return opts
			.map((opt) => `${opt.letter || ''}${opt.startPos || ''}${opt.endPos || ''}`)
			.join('|');
	}

	// Clone options for each transition to ensure safe separation
	function cloneOption(option: PictographData): PictographData {
		// With object pooling, we need to ensure we're not creating circular references
		// or other issues that might cause problems with structuredClone
		return {
			...option,
			letter: option.letter,
			startPos: option.startPos,
			endPos: option.endPos,
			timing: option.timing,
			direction: option.direction,
			gridMode: option.gridMode,
			blueMotionData: option.blueMotionData ? { ...option.blueMotionData } : null,
			redMotionData: option.redMotionData ? { ...option.redMotionData } : null,
			redPropData: option.redPropData ? { ...option.redPropData } : null,
			bluePropData: option.bluePropData ? { ...option.bluePropData } : null,
			redArrowData: option.redArrowData ? { ...option.redArrowData } : null,
			blueArrowData: option.blueArrowData ? { ...option.blueArrowData } : null,
			gridData: option.gridData ? { ...option.gridData } : null,
			grid: option.grid,
			isStartPosition: option.isStartPosition
		};
	}

	// Watch for changes in the options using $effect
	$effect(() => {
		if (options) {
			const newOptionIds = getOptionsSignature(options);

			if (!initialized) {
				// First render: set initial state, no transition
				currentOptions = options.map(cloneOption);
				lastOptionIds = newOptionIds; // Set initial signature
				initialized = true;
			} else if (newOptionIds !== lastOptionIds) {
				// Subsequent renders with changed options: perform transition
				lastOptionIds = newOptionIds; // Update signature

				// If we are already transitioning, immediately finish the current transition
				if (isTransitioning && transitionTimeout) {
					clearTimeout(transitionTimeout);
					transitionTimeout = null;
					// Consider if immediate state cleanup is needed here, e.g., previousOptions = []
				}

				// If there are current options, move them to previous before updating
				// Ensure we only start a new transition if there were options to transition from
				if (currentOptions.length > 0) {
					previousOptions = currentOptions.map(cloneOption);
					isTransitioning = true;

					// Increment transition key to force re-render
					transitionKey = transitionKey + 1;

					// Set timeout to end transition
					const actualDuration = prefersReducedMotion() ? 50 : transitionDuration;
					transitionTimeout = setTimeout(() => {
						isTransitioning = false;
						previousOptions = []; // Clear previous options when transition ends
						transitionTimeout = null;
					}, actualDuration + 50); // Add a small buffer
				} else {
					// If there were no current options (e.g., initial empty state), don't set transitioning
					isTransitioning = false;
				}

				// Update current options with the new options
				currentOptions = options.map(cloneOption);
			}
			// If initialized and newOptionIds === lastOptionIds, do nothing.
		}
	});

	// Clean up on destroy
	onDestroy(() => {
		if (transitionTimeout) {
			clearTimeout(transitionTimeout);
			transitionTimeout = null;
		}
	});

	// Simple fade out only - no scaling/sliding that could cause layout issues
	function cleanFadeOut(node: HTMLElement, { duration = transitionDuration } = {}) {
		const actualDuration = prefersReducedMotion() ? 50 : duration;

		// Apply initial styles immediately to prevent layout shifts
		node.style.position = 'absolute';
		node.style.top = '0';
		node.style.left = '0';
		node.style.width = '100%';
		node.style.height = '100%';
		node.style.pointerEvents = 'none';
		node.style.zIndex = '1';

		return {
			duration: actualDuration,
			css: (t: number) => `opacity: ${Math.min(0.3, t * 0.3)};`
		};
	}

	// Simple fade in only - clean and straightforward
	function cleanFadeIn(node: HTMLElement, { duration = transitionDuration } = {}) {
		const actualDuration = prefersReducedMotion() ? 50 : duration;

		// Apply initial styles immediately to prevent layout shifts
		node.style.position = 'relative';
		node.style.zIndex = '2';

		return {
			duration: actualDuration,
			css: (t: number) => `opacity: ${t};`
		};
	}
</script>

<div class="options-transition-container">
	{#if isTransitioning && previousOptions.length > 0}
		<!-- Previous options (leaving) -->
		<div class="transition-panel outgoing" out:cleanFadeOut|local>
			{@render panel({ options: previousOptions, key: `prev-${transitionKey}` })}
		</div>
	{/if}

	<!-- Current options (entering) -->
	<div
		class="transition-panel incoming"
		in:cleanFadeIn|local={{ duration: isTransitioning ? 200 : 0 }}
	>
		{@render panel({ options: currentOptions, key: `current-${transitionKey}` })}
	</div>
</div>

<style>
	.options-transition-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.transition-panel {
		width: 100%;
		height: 100%;
	}

	.incoming {
		position: relative;
	}
</style>
