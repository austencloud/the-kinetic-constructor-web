<!-- src/lib/components/SequenceWorkbench/RightPanel/TransitionWrapper.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	// Props
	export let isSequenceEmpty: boolean;
	export let transitionDuration = 400;

	// State
	let previousState = isSequenceEmpty;
	let isTransitioning = false;
	let showStartPosPicker = isSequenceEmpty;
	let showOptionPicker = !isSequenceEmpty;
	let containerHeight = 0;
	let startPosPickerHeight = 0;
	let optionPickerHeight = 0;
	let startPosPickerElement: HTMLElement | null = null;
	let optionPickerElement: HTMLElement | null = null;
	let containerElement: HTMLElement | null = null;

	// Track when the component is mounted
	let isMounted = false;

	onMount(() => {
		isMounted = true;

		// Initialize both components
		showStartPosPicker = true;
		showOptionPicker = true;

		// Initialize heights after a short delay to ensure DOM is ready
		setTimeout(() => {
			preInitializeComponents();
			updateHeights();

			// Hide the component that shouldn't be visible initially
			if (isSequenceEmpty) {
				showOptionPicker = false;
			} else {
				showStartPosPicker = false;
			}
		}, 50);
	});

	// Update container height when component dimensions change
	function updateHeights() {
		if (!isMounted) return;

		// For the start position picker, we want to use the full height of the container
		// This ensures the start position picker is centered vertically
		if (containerElement) {
			const containerParentHeight = containerElement.parentElement?.clientHeight || 0;
			if (containerParentHeight > 0) {
				startPosPickerHeight = containerParentHeight;
			} else {
				// Fallback to scrollHeight if parent height is not available
				if (startPosPickerElement) {
					startPosPickerHeight = startPosPickerElement.scrollHeight;
				}
			}
		}

		// For the option picker, we use its actual content height
		if (optionPickerElement) {
			optionPickerHeight = optionPickerElement.scrollHeight;
		}

		// Set container height to the height of the visible component
		const newHeight = isSequenceEmpty ? startPosPickerHeight : optionPickerHeight;

		// Only update if height has changed
		if (newHeight !== containerHeight && newHeight > 0) {
			containerHeight = newHeight;

			// Update container style with animation
			if (containerElement) {
				containerElement.style.height = `${containerHeight}px`;
			}
		}
	}

	// Add a resize observer to update heights when content changes
	onMount(() => {
		const resizeObserver = new ResizeObserver(() => {
			updateHeights();
		});

		if (startPosPickerElement) {
			resizeObserver.observe(startPosPickerElement);
		}

		if (optionPickerElement) {
			resizeObserver.observe(optionPickerElement);
		}

		return () => {
			resizeObserver.disconnect();
		};
	});

	// Watch for changes in isSequenceEmpty and handle transitions
	$: if (isMounted && previousState !== isSequenceEmpty) {
		handleTransition();
		previousState = isSequenceEmpty;
	}

	// Pre-initialize both components to ensure proper layout
	function preInitializeComponents() {
		// For the start position picker, we want to use the full height of the container
		if (containerElement) {
			const containerParentHeight = containerElement.parentElement?.clientHeight || 0;
			if (containerParentHeight > 0) {
				startPosPickerHeight = containerParentHeight;
			} else if (startPosPickerElement) {
				startPosPickerHeight = startPosPickerElement.scrollHeight;
			}
		}

		// For the option picker, we need to ensure it's properly sized before transition
		if (containerElement && !optionPickerHeight) {
			// Use the container's parent height as a starting point
			const containerParentHeight = containerElement.parentElement?.clientHeight || 0;
			if (containerParentHeight > 0) {
				optionPickerHeight = containerParentHeight;
			}
		}
	}

	// Handle the transition between components
	function handleTransition() {
		if (isTransitioning) return;
		isTransitioning = true;

		// Ensure both components are properly initialized
		preInitializeComponents();

		// Measure both components before transition
		if (startPosPickerElement) {
			startPosPickerHeight = startPosPickerElement.scrollHeight || startPosPickerHeight;
		}
		if (optionPickerElement) {
			optionPickerHeight = optionPickerElement.scrollHeight || optionPickerHeight;
		}

		// Preserve the current height during transition
		if (containerElement) {
			containerElement.style.height = `${containerHeight}px`;

			// Animate to the new height
			setTimeout(() => {
				const newHeight = isSequenceEmpty ? startPosPickerHeight : optionPickerHeight;
				if (containerElement) {
					containerElement.style.height = `${newHeight}px`;
					containerHeight = newHeight;
				}
			}, 50); // Small delay to ensure DOM is ready
		}

		// If transitioning to StartPosPicker
		if (isSequenceEmpty) {
			// Show StartPosPicker immediately to ensure animation plays
			showStartPosPicker = true;

			// Force a reflow to ensure the animation triggers properly
			if (startPosPickerElement) {
				void startPosPickerElement.offsetHeight;
			}

			// Hide OptionPicker after transition completes
			setTimeout(() => {
				showOptionPicker = false;
				isTransitioning = false;
			}, transitionDuration + 50); // Add a small buffer to ensure animation completes
		}
		// If transitioning to OptionPicker
		else {
			// Show OptionPicker immediately to ensure animation plays
			showOptionPicker = true;

			// Force a reflow to ensure the animation triggers properly
			if (optionPickerElement) {
				void optionPickerElement.offsetHeight;
			}

			// Hide StartPosPicker after transition completes
			setTimeout(() => {
				showStartPosPicker = false;
				isTransitioning = false;
			}, transitionDuration + 50); // Add a small buffer to ensure animation completes
		}
	}

	// Transition parameters

	// Different fly parameters for entering and exiting
	const flyInParams = {
		duration: transitionDuration,
		easing: cubicInOut,
		y: 20, // Reduced distance for smoother animation
		opacity: 0,
		delay: 50 // Small delay to ensure proper sequencing
	};

	const flyOutParams = {
		duration: transitionDuration * 0.7, // Slightly faster exit for better UX
		easing: cubicInOut,
		y: -15, // Reduced distance for smoother animation
		opacity: 0
	};

	// Track if this is the first render to prevent animation on initial load
	let isFirstRender = true;

	// After component is mounted, set isFirstRender to false
	onMount(() => {
		// Set isFirstRender to false after a short delay
		setTimeout(() => {
			isFirstRender = false;
		}, 100);
	});
</script>

<div class="transition-container" bind:this={containerElement}>
	{#if showStartPosPicker}
		<div
			class="component-wrapper start-pos-wrapper"
			class:active={isSequenceEmpty}
			bind:this={startPosPickerElement}
			in:fly={isFirstRender ? { duration: 0 } : flyInParams}
			out:fly={flyOutParams}
		>
			<slot name="startPosPicker" />
		</div>
	{/if}

	{#if showOptionPicker}
		<div
			class="component-wrapper option-picker-wrapper"
			class:active={!isSequenceEmpty}
			bind:this={optionPickerElement}
			in:fly={isFirstRender ? { duration: 0 } : flyInParams}
			out:fly={flyOutParams}
		>
			<slot name="optionPicker" />
		</div>
	{/if}
</div>

<style>
	.transition-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: height;
		display: flex;
		flex-direction: column;
		transform: translateZ(0); /* Force hardware acceleration */
	}

	.component-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%; /* Fill the entire height */
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: opacity, transform;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: center; /* Center content vertically */
		align-items: center; /* Center content horizontally */
		transform-origin: center center; /* Ensure transforms are centered */
		backface-visibility: hidden; /* Prevent flickering */
		-webkit-backface-visibility: hidden;
		transform-style: preserve-3d; /* Improve rendering */
		-webkit-transform-style: preserve-3d; /* Improve rendering on WebKit */
	}

	.component-wrapper.active {
		opacity: 1;
		transform: translateY(0);
		pointer-events: all;
	}

	/* Ensure both components are properly centered from the start */
	.component-wrapper > :global(*) {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	/* Ensure the start position picker has proper styling */
	.start-pos-wrapper {
		z-index: 2;
	}

	/* Ensure the option picker has proper styling */
	.option-picker-wrapper {
		z-index: 1;
	}
</style>
