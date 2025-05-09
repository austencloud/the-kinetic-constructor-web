<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable, get } from 'svelte/store';
	import { cubicOut } from 'svelte/easing';
	import type { PictographData } from '$lib/types/PictographData';
	import { prefersReducedMotion } from '../utils/a11y';

	// Props
	export let options: PictographData[] = [];
	export let transitionDuration = 300;

	// Internal state
	let previousOptions = writable<PictographData[]>([]);
	let currentOptions = writable<PictographData[]>([]);
	let isTransitioning = writable(false);
	let transitionKey = writable(0);
	let transitionTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Add option set tracking to prevent excessive transitions
	let lastOptionIds = '';
	let initialized = false;

	// Shallow comparison function for option arrays
	function getOptionsSignature(opts: PictographData[]): string {
		return opts.map(opt => 
			`${opt.letter || ''}${opt.startPos || ''}${opt.endPos || ''}`
		).join('|');
	}

	// Clone options for each transition to ensure safe separation
	function cloneOption(option: PictographData): PictographData {
		return {
			...option,
			blueMotionData: option.blueMotionData ? { ...option.blueMotionData } : null,
			redMotionData: option.redMotionData ? { ...option.redMotionData } : null,
			// Clone other nested objects as needed
		};
	}

	// Watch for changes in the options
	$: if (options) {
		const newOptionIds = getOptionsSignature(options);

		if (!initialized) {
			// First render: set initial state, no transition
			currentOptions.set(options.map(cloneOption));
			lastOptionIds = newOptionIds; // Set initial signature
			initialized = true;
		} else if (newOptionIds !== lastOptionIds) {
			// Subsequent renders with changed options: perform transition
			lastOptionIds = newOptionIds; // Update signature

			// If we are already transitioning, immediately finish the current transition
			if ($isTransitioning && transitionTimeout) {
				clearTimeout(transitionTimeout);
				transitionTimeout = null;
				// Consider if immediate state cleanup is needed here, e.g., previousOptions.set([])
			}

			// If there are current options, move them to previous before updating
			// Ensure we only start a new transition if there were options to transition from
			if ($currentOptions.length > 0) {
				previousOptions.set($currentOptions.map(cloneOption));
				isTransitioning.set(true);

				// Increment transition key to force re-render
				transitionKey.update(key => key + 1);

				// Set timeout to end transition
				const actualDuration = $prefersReducedMotion ? 50 : transitionDuration;
				transitionTimeout = setTimeout(() => {
					isTransitioning.set(false);
					previousOptions.set([]); // Clear previous options when transition ends
					transitionTimeout = null;
				}, actualDuration + 50); // Add a small buffer
			} else {
				// If there were no current options (e.g., initial empty state), don't set transitioning
				isTransitioning.set(false); 
			}

			// Update current options with the new options
			currentOptions.set(options.map(cloneOption));
		}
		// If initialized and newOptionIds === lastOptionIds, do nothing.
	}

	// Clean up on destroy
	onDestroy(() => {
		if (transitionTimeout) {
			clearTimeout(transitionTimeout);
			transitionTimeout = null;
		}
	});

	// Simple fade out only - no scaling/sliding that could cause layout issues
	function cleanFadeOut(node: HTMLElement, { 
		duration = transitionDuration
	} = {}) {
		const actualDuration = $prefersReducedMotion ? 50 : duration;
		return {
			duration: actualDuration,
			css: (t: number) => `
				opacity: ${Math.min(0.3, t * 0.3)}; 
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				pointer-events: none;
				z-index: 1;
			`
		};
	}

	// Simple fade in only - clean and straightforward
	function cleanFadeIn(node: HTMLElement, { 
		duration = transitionDuration
	} = {}) {
		const actualDuration = $prefersReducedMotion ? 50 : duration;
		return {
			duration: actualDuration,
			css: (t: number) => `
				opacity: ${t};
				position: relative;
				z-index: 2;
			`
		};
	}
</script>

<div class="options-transition-container">
	{#if $isTransitioning && $previousOptions.length > 0}
		<!-- Previous options (leaving) -->
		<div class="transition-panel outgoing" out:cleanFadeOut|local>
			<slot name="panel" options={$previousOptions} key={`prev-${$transitionKey}`} />
		</div>
	{/if}

	<!-- Current options (entering) -->
	<div class="transition-panel incoming" in:cleanFadeIn|local={{ duration: $isTransitioning ? 200 : 0 }}>
		<slot name="panel" options={$currentOptions} key={`current-${$transitionKey}`} />
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