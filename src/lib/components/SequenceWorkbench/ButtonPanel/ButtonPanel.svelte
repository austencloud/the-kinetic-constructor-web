<script lang="ts">
	// Removed 'watch' from import
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment'; // Import browser check for SSR safety

	// Import Child Components
	import ButtonsContainer from './components/ButtonsContainer.svelte';
	import ToggleHandle from './components/ToggleHandle.svelte';

	// Import Stores
	import { panelStore, buttonSizeStore } from './stores/panelStore';
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { beatsStore } from '$lib/stores/sequence/beatsStore'; // For clearSequence action

	// Import Types
	import type { ButtonDefinition, ActionEventDetail, LayoutOrientation } from './types';

	// Import Utils
	import { ANIMATION_DURATIONS } from './utils/animations';

	// --- Component Props ---
	export let containerWidth = 0;
	export let containerHeight = 0;
	export let isPortrait = true;
	export let buttons: ButtonDefinition[] = [];

	// --- Event Dispatcher ---
	const dispatch = createEventDispatcher<{
		action: ActionEventDetail;
		visibilityChange: { visible: boolean };
	}>();

	// --- State from Store ---
	// Use reactive $ syntax for automatic subscription and unsubscription
	$: ({ isVisible, isPulsing, layout } = $panelStore);
	$: isAnimatingOut = $panelStore.isAnimatingOut; // Get isAnimatingOut for reactive statement

	// --- Derived Values ---
	// Calculate layout based on orientation and update the store
	// Explicitly type newLayout to potentially help TypeScript
	$: newLayout = isPortrait ? 'horizontal' : 'vertical';
	$: if (browser && newLayout !== layout) { // Update store only when layout actually changes
		panelStore.setLayout(newLayout as LayoutOrientation); // Pass the correctly typed variable
	}

	// Calculate button size using the derived store function
	// Note: buttonSizeStore provides a function, we need to call it
	$: buttonSizeFn = $buttonSizeStore;
	$: buttonSize = buttonSizeFn(containerWidth, containerHeight, isPortrait);

	// --- Event Handlers ---
	function handleButtonClick(event: CustomEvent<ActionEventDetail>) {
		const { id } = event.detail;

		// Dispatch the action event to the parent
		dispatch('action', { id });

		// Handle specific actions locally if needed (like clearSequence)
		if (id === 'clearSequence') {
			selectedStartPos.set(null);
			isSequenceEmpty.set(true);
			beatsStore.set([]); // Clear beats using the store's set method

			// Optional: Dispatch a global event if other unrelated components need to know
			if (browser) {
				const customEvent = new CustomEvent('sequence-cleared', { bubbles: true });
				document.dispatchEvent(customEvent);
			}
		}
	}

	function handleToggle() {
		// Use the store's toggle action
		panelStore.toggle();
		// The timeout logic is now handled by the reactive statement below
	}

	// --- Lifecycle ---
	let buttonsReady = false;
	let pulseTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let hideTimeoutId: ReturnType<typeof setTimeout> | null = null; // Timeout for hide animation

	onMount(() => {
		if (!browser) return; // Don't run on server

		// Load Font Awesome CSS if not already present
		if (!document.getElementById('font-awesome-css')) {
			const link = document.createElement('link');
			link.id = 'font-awesome-css';
			link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		}

		// Load MDB Ripple CSS & JS if not already present
		if (!document.getElementById('mdb-ripple-js')) {
			const linkMDB = document.createElement('link');
			linkMDB.id = 'mdb-ripple-css';
			linkMDB.href = 'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.3.0/mdb.min.css';
			linkMDB.rel = 'stylesheet';
			document.head.appendChild(linkMDB);

			const scriptMDB = document.createElement('script');
			scriptMDB.id = 'mdb-ripple-js';
			scriptMDB.src = 'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.3.0/mdb.min.js';
			scriptMDB.async = true; // Load asynchronously
			scriptMDB.onload = () => {
				buttonsReady = true;
				// Initialize ripple after a short delay to ensure elements are rendered
				setTimeout(initializeRipple, 100);
			};
			document.body.appendChild(scriptMDB);
		} else {
			// MDB already loaded
			buttonsReady = true;
			setTimeout(initializeRipple, 100);
		}

		// Stop pulsing after a delay, only if it's currently pulsing
		// Use $panelStore directly here as isPulsing is reactive
		if ($panelStore.isPulsing) {
			pulseTimeoutId = setTimeout(() => {
				panelStore.stopPulsing();
			}, ANIMATION_DURATIONS.PULSE_STOP_DELAY);
		}
	});

	onDestroy(() => {
		// Clear timeouts if the component is destroyed before they fire
		if (pulseTimeoutId) clearTimeout(pulseTimeoutId);
		if (hideTimeoutId) clearTimeout(hideTimeoutId);
		// Note: No need to manually unsubscribe from stores when using $ syntax
	});

	// Function to initialize MDB Ripple effect
	function initializeRipple() {
		// Ensure this runs only in the browser and MDB is loaded
		if (!browser || !buttonsReady || typeof window === 'undefined' || !(window as any).mdb) return;

		const mdb = (window as any).mdb;

		// Query for ripple elements globally. This should find elements in child components.
		const rippleButtons = document.querySelectorAll('.ripple'); // Use the common class
		rippleButtons.forEach((button) => {
			if (mdb.Ripple && button instanceof HTMLElement) {
				// Ensure ripple isn't initialized multiple times on the same element
				const instance = mdb.Ripple.getInstance(button);
				if (!instance) {
					new mdb.Ripple(button, { rippleColor: 'light' }); // Set default color
				}
			}
		});
	}

	// --- Reactive Effects ---
	// Emit an event when toolbar visibility changes
	$: if (browser && isVisible !== undefined) { // Check browser env and ensure isVisible is defined
		dispatch('visibilityChange', { visible: isVisible });
	}

	// Re-initialize ripple if the layout changes and buttons become visible again
	$: if (browser && isVisible && buttonsReady) {
		setTimeout(initializeRipple, 50); // Delay slightly after visibility change
	}

	// Reactive statement to handle the hide animation timeout
	// This block runs whenever isAnimatingOut changes
	$: {
		if (browser && isAnimatingOut === true) {
			// If starting to animate out, set the timeout
			// Clear any existing timeout first
			if (hideTimeoutId) clearTimeout(hideTimeoutId);
			// Set timeout to complete the hide animation after the duration
			hideTimeoutId = setTimeout(() => {
				panelStore.completeHideAnimation();
			}, ANIMATION_DURATIONS.TOGGLE_OUT); // Use duration from utils
		} else {
			// If not animating out (or animation stopped), clear any pending timeout
			if (hideTimeoutId) {
				clearTimeout(hideTimeoutId);
				hideTimeoutId = null; // Reset the ID
			}
		}
	} // End of reactive block

</script>

<div
	class="toolbar-container"
	class:vertical={layout === 'vertical'}
	class:hidden={!isVisible && !isAnimatingOut}
	style="--button-size: {buttonSize}px;"
>
	<ButtonsContainer
		{buttons}
		{buttonSize}
		on:action={handleButtonClick}
	/>

	<ToggleHandle
		{buttonSize}
		{layout}
		{isVisible}
		{isPulsing}
		on:toggle={handleToggle}
	/>
</div>

<style>
	/* Styles for the main container - child component styles are encapsulated */
	.toolbar-container {
		display: flex;
		/* Apply background/blur only when visible or animating out */
		background-color: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
		position: relative;
		overflow: visible; /* Allow toggle handle/animations to overflow */
		padding: 8px; /* Add padding to contain the buttons container */
	}

	/* Layout styles */
	.toolbar-container.vertical {
		flex-direction: column;
		width: max-content; /* Adjust width based on content */
		align-items: center;
	}

	.toolbar-container:not(.vertical) {
		flex-direction: row;
		height: max-content; /* Adjust height based on content */
		align-items: center;
	}

	/* Handle hidden state (when not visible AND not animating out) */
	.toolbar-container.hidden {
		background-color: transparent;
		backdrop-filter: none;
		border: none;
		padding: 0; /* Remove padding when hidden */
	}

	/* Ensure ripple works correctly by setting position relative */
	:global(.ripple) {
		position: relative;
		overflow: hidden;
	}
</style>
