<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment'; // Import browser check for SSR safety

	// Import Child Components
	import ButtonsContainer from './components/ButtonsContainer.svelte';

	// Import Stores
	import { panelState, calculateButtonSizeForDimensions } from './stores/panelState.svelte';
	import { sequenceActions } from '$lib/state/machines/sequenceMachine';
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';

	// Import Types
	import type { ButtonDefinition, ActionEventDetail, LayoutOrientation } from './types';

	// Props using Svelte 5 runes
	const {
		containerWidth = 0,
		containerHeight = 0,
		buttons = [],
		onaction
	} = $props<{
		containerWidth?: number;
		containerHeight?: number;
		buttons?: ButtonDefinition[];
		onaction?: (detail: ActionEventDetail) => void;
	}>();

	// State from Store using $derived
	const layoutFromStore = $derived(panelState.state.layout);

	// Derived Values using $derived
	const isContainerPortrait = $derived(containerHeight > containerWidth);
	const newLayout = $derived(
		isContainerPortrait ? 'horizontal' : ('vertical' as LayoutOrientation)
	);

	// Update the central store only if the calculated layout differs from the stored one using $effect
	$effect(() => {
		if (browser && newLayout !== layoutFromStore) {
			panelState.setLayout(newLayout);
		}
	});

	// Calculate button size using the calculated orientation
	const buttonSize = $derived(
		calculateButtonSizeForDimensions(containerWidth, containerHeight, isContainerPortrait)
	);

	// --- Event Handlers ---
	async function handleButtonClick(detail: ActionEventDetail) {
		const { id } = detail;
		onaction?.({ id });

		if (id === 'clearSequence') {
			// Clear both the legacy sequence machine and the new sequence state
			sequenceActions.clearSequence();

			// Also clear the new Svelte 5 runes sequence state
			await sequenceState.clearSequence();

			if (browser) {
				const customEvent = new CustomEvent('sequence-cleared', { bubbles: true });
				document.dispatchEvent(customEvent);
			}
		}
	}

	// --- Lifecycle ---
	let buttonsReady = $state(false);

	onMount(() => {
		if (!browser) return;

		// Load Font Awesome CSS
		if (!document.getElementById('font-awesome-css')) {
			const link = document.createElement('link');
			link.id = 'font-awesome-css';
			link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		}

		// Load MDB Ripple CSS & JS
		if (!document.getElementById('mdb-ripple-js')) {
			const linkMDB = document.createElement('link');
			linkMDB.id = 'mdb-ripple-css';
			linkMDB.href = 'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.3.0/mdb.min.css';
			linkMDB.rel = 'stylesheet';
			document.head.appendChild(linkMDB);

			const scriptMDB = document.createElement('script');
			scriptMDB.id = 'mdb-ripple-js';
			scriptMDB.src = 'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.3.0/mdb.min.js';
			scriptMDB.async = true;
			scriptMDB.onload = () => {
				buttonsReady = true;
				setTimeout(initializeRipple, 100);
			};
			document.body.appendChild(scriptMDB);
		} else {
			buttonsReady = true;
			setTimeout(initializeRipple, 100);
		}
	});

	function initializeRipple() {
		if (!browser || !buttonsReady || typeof window === 'undefined' || !(window as any).mdb) return;
		const mdb = (window as any).mdb;
		const rippleButtons = document.querySelectorAll('.ripple');
		rippleButtons.forEach((button) => {
			if (mdb.Ripple && button instanceof HTMLElement) {
				const instance = mdb.Ripple.getInstance(button);
				if (!instance) {
					new mdb.Ripple(button, { rippleColor: 'light' });
				}
			}
		});
	}
</script>

<div
	class="toolbar-container"
	class:vertical={newLayout === 'vertical'}
	style="--button-size: {buttonSize}px;"
>
	<ButtonsContainer {buttons} {buttonSize} layout={newLayout} onaction={handleButtonClick} />
</div>

<style>
	.toolbar-container {
		display: flex; /* Use flexbox for layout */
		background-color: transparent;
		border-radius: 12px;
		transition: background-color 0.3s ease;
		position: relative;
		overflow: visible;
		box-sizing: border-box; /* Include padding in dimensions */
		min-width: 60px; /* Ensure minimum width */
		flex-shrink: 0; /* Prevent shrinking */
	}

	/* Vertical Layout */
	.toolbar-container.vertical {
		flex-direction: column; /* Stack child vertically */
		width: max-content; /* Fit width to content (ButtonsContainer) */
		min-width: 60px; /* Ensure minimum width */
		height: 100%; /* Crucial: Take full height of its parent */
		justify-content: center; /* Center child (ButtonsContainer) vertically */
		align-items: center; /* Center child horizontally */
		flex-shrink: 0; /* Prevent shrinking */
		padding: 0 5px; /* Add horizontal padding */
	}

	/* Horizontal Layout (Default) */
	.toolbar-container:not(.vertical) {
		flex-direction: row; /* Arrange child horizontally */
		width: 100%; /* Take full width */
		height: max-content; /* Fit height to content */
		min-height: 60px; /* Ensure minimum height */
		align-items: center; /* Center child vertically */
		justify-content: center; /* Center child horizontally */
		flex-shrink: 0; /* Prevent shrinking */
		padding: 5px 0; /* Add vertical padding */
	}

	/* Ensure ripple works correctly */
	:global(.ripple) {
		position: relative;
		overflow: hidden;
	}
</style>
