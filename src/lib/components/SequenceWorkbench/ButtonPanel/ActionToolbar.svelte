<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
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

	// --- Component Props ---
	export let containerWidth = 0;
	export let containerHeight = 0;
	export let buttons: ButtonDefinition[] = [];

	// --- Event Dispatcher ---
	const dispatch = createEventDispatcher<{
		action: ActionEventDetail;
	}>();

	// --- Local State ---
	// For mobile slide-out panel
	let isVisible = true; // Controls visibility of panel
	let isMobilePanelOpen = false; // Controls state of slide-out panel
	let isPulsing = true; // For animation

	// --- State from Store ---
	// Read layout from store primarily for potential external listeners,
	// but internal logic will use the calculated newLayout directly.
	$: ({ layout: layoutFromStore } = $panelStore);

	// --- Derived Values ---
	// Calculate orientation based on received container dimensions
	$: isContainerPortrait = containerHeight > containerWidth;
	// Determine the desired layout based on the container's orientation
	$: newLayout = isContainerPortrait ? 'horizontal' : ('vertical' as LayoutOrientation);
	// Check if we're on a very small screen (mobile)
	$: isMobileView = containerWidth < 480;

	// Update the central store only if the calculated layout differs from the stored one
	$: if (browser && newLayout !== layoutFromStore) {
		panelStore.setLayout(newLayout);
	}

	// Calculate button size using the calculated orientation
	$: buttonSizeFn = $buttonSizeStore;
	$: buttonSize = buttonSizeFn(containerWidth, containerHeight, isContainerPortrait);

	// Handle panel toggle
	function handleTogglePanel() {
		if (isMobileView) {
			isMobilePanelOpen = !isMobilePanelOpen;
		} else {
			isVisible = !isVisible;
		}

		// Stop pulsing animation after first interaction
		if (isPulsing) isPulsing = false;
	}

	// --- Event Handlers ---
	function handleButtonClick(event: CustomEvent<ActionEventDetail>) {
		const { id } = event.detail;
		dispatch('action', { id });

		// Auto-close mobile panel after button click
		if (isMobileView && isMobilePanelOpen) {
			isMobilePanelOpen = false;
		}

		if (id === 'clearSequence') {
			selectedStartPos.set(null);
			isSequenceEmpty.set(true);
			beatsStore.set([]);

			if (browser) {
				const customEvent = new CustomEvent('sequence-cleared', { bubbles: true });
				document.dispatchEvent(customEvent);
			}
		}
	}

	// --- Lifecycle ---
	let buttonsReady = false;

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

		// Stop pulsing after a few seconds
		const timer = setTimeout(() => {
			isPulsing = false;
		}, 5000);

		return () => clearTimeout(timer);
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
	class:mobile-view={isMobileView}
	class:mobile-open={isMobilePanelOpen}
	class:hidden={!isVisible && !isMobileView}
	style="--button-size: {buttonSize}px;"
>
	{#if isMobileView}
		<!-- Mobile slide-out panel -->
		<div
			class="mobile-panel-overlay"
			class:visible={isMobilePanelOpen}
			on:click={() => (isMobilePanelOpen = false)}
		></div>
		<div class="mobile-panel" class:open={isMobilePanelOpen}>
			<div class="mobile-panel-header">
				<span>Tools</span>
				<button
					class="close-button"
					on:click={() => (isMobilePanelOpen = false)}
					aria-label="Close tools panel"
				>
					<i class="fa-solid fa-times"></i>
				</button>
			</div>
			<ButtonsContainer {buttons} {buttonSize} layout="vertical" on:action={handleButtonClick} />
		</div>
	{:else}
		<!-- Regular button panel -->
		<ButtonsContainer {buttons} {buttonSize} layout={newLayout} on:action={handleButtonClick} />
	{/if}
</div>

<!-- Toggle handle - positioned absolutely -->
<div class="toggle-handle-wrapper" class:mobile={isMobileView}>
	<ToggleHandle
		{buttonSize}
		layout={isMobileView ? 'vertical' : newLayout}
		isVisible={isMobileView ? isMobilePanelOpen : isVisible}
		{isPulsing}
		on:toggle={handleTogglePanel}
	/>
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

	/* Hidden state for standard panel */
	.toolbar-container.hidden {
		display: none;
	}

	/* Mobile panel styles */
	.toolbar-container.mobile-view {
		position: relative;
		width: 0;
		min-width: 0;
		height: 0;
		padding: 0;
		overflow: visible;
	}

	.mobile-panel-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 100;
		display: none;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.mobile-panel-overlay.visible {
		display: block;
		opacity: 1;
	}

	.mobile-panel {
		position: fixed;
		top: 50%;
		left: 0;
		transform: translateY(-50%) translateX(-100%);
		width: auto;
		max-width: none;
		height: auto;
		max-height: 80vh;
		background: linear-gradient(135deg, rgba(25, 30, 45, 0.95), rgba(10, 15, 25, 0.95));
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		z-index: 101;
		box-shadow: 2px 0 15px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease-in-out;
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		border-radius: 0 8px 8px 0;
		overflow-y: auto;
	}

	.mobile-panel.open {
		transform: translateY(-50%) translateX(0);
	}

	.mobile-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.mobile-panel-header span {
		color: white;
		font-weight: 600;
		font-size: 1rem;
		letter-spacing: 0.5px;
	}

	.close-button {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	.close-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
	}

	/* Toggle handle positioning - now outside the toolbar container */
	.toggle-handle-wrapper {
		position: absolute;
		z-index: 102;
	}

	.toggle-handle-wrapper.mobile {
		top: 50%;
		left: 0;
		transform: translateY(-50%);
	}

	/* Ensure ripple works correctly */
	:global(.ripple) {
		position: relative;
		overflow: hidden;
	}
</style>
