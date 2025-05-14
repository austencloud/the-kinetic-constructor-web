<script lang="ts">
	import {
		imageExportSettings,
		saveImageExportSettings,
		defaultImageExportSettings
	} from '$lib/state/image-export-settings';
	import { onMount, onDestroy } from 'svelte';
	import type { ImageExportSettings } from '$lib/state/image-export-settings';
	import { browser } from '$app/environment';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// Import components
	import ImageExportControlPanel from './ImageExportControlPanel.svelte';
	import ImageExportPreviewPanel from './ImageExportPreviewPanel.svelte';

	// Local state to bind to UI
	let settings = $state<ImageExportSettings>({
		// Export content options
		includeStartPosition: true,
		addUserInfo: true,
		addWord: true,
		addDifficultyLevel: false,
		addBeatNumbers: true,
		addReversalSymbols: true,

		// User information
		userName: 'User',
		customNote: 'Created with The Kinetic Constructor',

		// Directory preferences
		rememberLastSaveDirectory: true,
		lastSaveDirectory: ''
	});

	// Subscribe to the store to get updates
	let unsubscribe: (() => void) | undefined;

	// Initialize from the store
	function init() {
		unsubscribe = imageExportSettings.subscribe((value) => {
			settings = { ...value };
		});
	}

	// Cleanup on component destroy
	function cleanup() {
		if (unsubscribe) {
			unsubscribe();
		}
	}

	// Initialize on mount and cleanup on destroy
	onMount(init);
	onDestroy(cleanup);

	// Handle setting change
	function handleSettingChange(key: keyof ImageExportSettings, value: any): void {
		// Create a new settings object with the updated value
		const newSettings = { ...settings } as ImageExportSettings;

		// Type assertion to fix TypeScript error
		(newSettings as any)[key] = value;

		// Update local state
		settings = newSettings;

		// Update the store
		updateStore();
	}

	// Update the store with current settings
	function updateStore(): void {
		imageExportSettings.set(settings);
		saveImageExportSettings();
	}

	// Reset settings to defaults
	function resetToDefaults(): void {
		// Provide haptic feedback for reset action
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('warning');
		}

		// Reset settings to defaults
		settings = { ...defaultImageExportSettings };

		// Update the store
		updateStore();

		// Clear localStorage
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('image-export-settings');
		}
	}
</script>

<div class="image-export-tab">
	<h2>Image Export Settings</h2>

	<div class="split-panel">
		<div class="preview-panel-container">
			<h3>Export Preview</h3>
			<ImageExportPreviewPanel {settings} />
		</div>

		<div class="control-panel-container">
			<ImageExportControlPanel {settings} onSettingChange={handleSettingChange} />

			<div class="reset-container">
				<button class="reset-button" onclick={resetToDefaults}>
					<i class="fa-solid fa-arrows-rotate"></i>
					Reset to Defaults
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.image-export-tab {
		padding: 1rem;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	h2 {
		margin-bottom: 1.5rem;
		color: var(--color-text-primary, white);
		font-size: 1.6rem;
		font-weight: 600;
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--color-text-primary, white);
		border-bottom: 1px solid rgba(108, 156, 233, 0.3);
		padding-bottom: 0.5rem;
	}

	.split-panel {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		flex: 1;
		min-height: 0;
	}

	.preview-panel-container {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: rgba(10, 10, 12, 0.2);
		border-radius: 8px;
		padding: 1rem; /* Reduced padding to be more compact */
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-height: 350px; /* Reduced minimum height */
		height: 45%; /* Slightly reduced height percentage */
	}

	.control-panel-container {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		background: rgba(10, 10, 12, 0.2);
		border-radius: 8px;
		padding: 1rem; /* Reduced padding to be more compact */
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-height: 55vh; /* Limit height to ensure scrolling works */
		scrollbar-width: thin; /* Firefox */
		scrollbar-color: rgba(108, 156, 233, 0.3) rgba(20, 20, 25, 0.3); /* Firefox */
	}

	/* Custom scrollbar styling for Webkit browsers */
	.control-panel-container::-webkit-scrollbar {
		width: 8px;
	}

	.control-panel-container::-webkit-scrollbar-track {
		background: rgba(20, 20, 25, 0.3);
		border-radius: 4px;
	}

	.control-panel-container::-webkit-scrollbar-thumb {
		background: rgba(108, 156, 233, 0.3);
		border-radius: 4px;
	}

	.control-panel-container::-webkit-scrollbar-thumb:hover {
		background: rgba(108, 156, 233, 0.5);
	}

	.reset-container {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
	}

	.reset-button {
		background: linear-gradient(to bottom, #3a3a43, #2a2a2e);
		color: var(--color-text-primary, white);
		border: 2px solid var(--tkc-border-color, #3c3c41);
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-weight: bold;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transition: all 0.2s ease;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.reset-button:hover {
		background: linear-gradient(to bottom, #454550, #323238);
		transform: translateY(-2px);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
	}

	.reset-button:active {
		transform: translateY(0);
		background: linear-gradient(to bottom, #2a2a30, #1e1e22);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	/* Responsive styles */
	@media (max-width: 1366px) {
		.preview-panel-container {
			min-height: 320px;
			height: 40%;
		}

		.control-panel-container {
			max-height: 60vh;
		}

		.split-panel {
			gap: 1.5rem;
		}
	}

	@media (max-width: 1024px) {
		.preview-panel-container {
			min-height: 300px;
			height: 38%;
		}

		.control-panel-container {
			max-height: 62vh;
		}

		h2 {
			margin-bottom: 1rem;
			font-size: 1.4rem;
		}

		h3 {
			margin-bottom: 0.75rem;
			font-size: 1.1rem;
		}
	}

	@media (max-width: 768px) {
		.preview-panel-container {
			min-height: 280px;
			height: 35%;
		}

		.image-export-tab {
			padding: 0.75rem;
		}

		.split-panel {
			gap: 1rem;
		}
	}

	@media (max-width: 480px) {
		.preview-panel-container {
			min-height: 220px;
			height: 30%;
			padding: 0.75rem;
		}

		.image-export-tab {
			padding: 0.5rem;
		}

		.control-panel-container {
			padding: 0.75rem;
		}

		.split-panel {
			gap: 0.75rem;
		}

		h2 {
			font-size: 1.3rem;
			margin-bottom: 0.75rem;
		}

		h3 {
			font-size: 1rem;
			margin-bottom: 0.5rem;
		}

		.reset-container {
			margin-top: 1rem;
		}

		.reset-button {
			padding: 0.5rem 1rem;
			font-size: 0.9rem;
		}
	}
</style>
