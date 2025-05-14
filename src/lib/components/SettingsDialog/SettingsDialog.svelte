<script lang="ts">
	import { selectIsSettingsOpen } from '../MainWidget/state/store';
	import { actions } from '../MainWidget/state/actions';
	import SettingsContent from './SettingsContent.svelte';

	// --- Get State from XState ---
	const isSettingsDialogOpen = selectIsSettingsOpen();

	// --- Event Handlers ---

	// Listen for settings save and reset events
	function setupEventListeners() {
		// Listen for save events
		const handleSaveEvent = (event: CustomEvent) => {
			console.log('Settings saved:', event.detail);
			// Here you would handle the saved settings
		};

		// Listen for reset events
		const handleResetEvent = (event: CustomEvent) => {
			console.log('Settings reset for section:', event.detail.section);
			// Here you would handle the reset
		};

		// Add event listeners only in browser environment
		if (typeof window !== 'undefined') {
			window.addEventListener('save', handleSaveEvent as EventListener);
			window.addEventListener('reset', handleResetEvent as EventListener);

			// Return cleanup function
			return () => {
				window.removeEventListener('save', handleSaveEvent as EventListener);
				window.removeEventListener('reset', handleResetEvent as EventListener);
			};
		}

		return () => {}; // Empty cleanup function for SSR
	}

	// Set up event listeners when component is mounted
	import { onMount, onDestroy } from 'svelte';
	let cleanup: (() => void) | undefined;

	onMount(() => {
		cleanup = setupEventListeners();
	});

	onDestroy(() => {
		if (cleanup) cleanup();
	});

	// No sections needed anymore
</script>

<div class="content">
	{#if $isSettingsDialogOpen}
		<div class="settingsContent">
			<SettingsContent onClose={actions.closeSettings} />
		</div>
	{/if}
</div>

<style>
	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		z-index: 100; /* Higher z-index to ensure it appears above other content */
		width: 100%;
	}

	.settingsContent {
		flex: 0 0 auto;
		width: 100%;
		background: rgba(30, 40, 60, 0.9);
		backdrop-filter: blur(10px);
		border-top: 1px solid rgba(108, 156, 233, 0.2);
		max-height: 80vh; /* Increased height for better mobile experience */
		overflow: hidden; /* Let the inner content handle scrolling */
		border-radius: 12px 12px 0 0; /* Rounded corners on top */
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3); /* Add shadow for depth */
	}

	/* Mobile styles */
	@media (max-width: 480px) {
		.settingsContent {
			max-height: 90vh; /* Even more height on mobile */
		}
	}
</style>
