<script lang="ts">
	import {
		imageExportSettings,
		saveImageExportSettings,
		defaultImageExportSettings
	} from '$lib/state/image-export-settings';
	import { onMount, onDestroy } from 'svelte';
	import type { ImageExportSettings } from '$lib/state/image-export-settings';

	// Local state to bind to UI
	let settings = $state<ImageExportSettings>({
		includeStartPosition: true,
		addUserInfo: true,
		addWord: true,
		addDifficultyLevel: false,
		addBeatNumbers: true,
		addReversalSymbols: true,
		combinedGrids: false,
		backgroundColor: '#2a2a2e',
		quality: 0.92
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

	// Toggle setting handler
	function toggleSetting(setting: keyof ImageExportSettings): void {
		// Create a new settings object with the toggled value
		const newSettings = { ...settings } as ImageExportSettings;

		// Handle each setting type appropriately
		switch (setting) {
			case 'includeStartPosition':
			case 'addUserInfo':
			case 'addWord':
			case 'addDifficultyLevel':
			case 'addBeatNumbers':
			case 'addReversalSymbols':
			case 'combinedGrids':
				// Toggle boolean settings
				newSettings[setting] = !newSettings[setting];
				break;
			// Other setting types can be handled here if needed
		}

		settings = newSettings;
		updateStore();
	}

	// Update the store with current settings
	function updateStore(): void {
		imageExportSettings.set(settings);
		saveImageExportSettings();
	}

	// Reset settings to defaults
	function resetToDefaults(): void {
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

	<div class="settings-grid">
		<button
			class="setting-toggle-button"
			class:active={settings.includeStartPosition}
			onclick={() => toggleSetting('includeStartPosition')}
		>
			Start Position
		</button>

		<button
			class="setting-toggle-button"
			class:active={settings.addUserInfo}
			onclick={() => toggleSetting('addUserInfo')}
		>
			User Info
		</button>

		<button
			class="setting-toggle-button"
			class:active={settings.addWord}
			onclick={() => toggleSetting('addWord')}
		>
			Word
		</button>

		<button
			class="setting-toggle-button"
			class:active={settings.addDifficultyLevel}
			onclick={() => toggleSetting('addDifficultyLevel')}
		>
			Difficulty Level
		</button>

		<button
			class="setting-toggle-button"
			class:active={settings.addBeatNumbers}
			onclick={() => toggleSetting('addBeatNumbers')}
		>
			Beat Numbers
		</button>

		<button
			class="setting-toggle-button"
			class:active={settings.addReversalSymbols}
			onclick={() => toggleSetting('addReversalSymbols')}
		>
			Reversal Symbols
		</button>

		<button
			class="setting-toggle-button"
			class:active={settings.combinedGrids}
			onclick={() => toggleSetting('combinedGrids')}
		>
			Combined Grids
		</button>
	</div>

	<div class="color-picker">
		<label for="bg-color">Background Color:</label>
		<input
			type="color"
			id="bg-color"
			bind:value={settings.backgroundColor}
			onchange={() => updateStore()}
		/>
	</div>

	<div class="quality-slider">
		<label for="quality">Image Quality: {Math.round(settings.quality * 100)}%</label>
		<input
			type="range"
			id="quality"
			min="0.5"
			max="1"
			step="0.01"
			bind:value={settings.quality}
			onchange={() => updateStore()}
		/>
	</div>

	<div class="reset-container">
		<button class="reset-button" onclick={resetToDefaults}>
			<i class="fa-solid fa-arrows-rotate"></i>
			Reset to Defaults
		</button>
	</div>
</div>

<style>
	.image-export-tab {
		padding: 1rem;
	}

	h2 {
		margin-bottom: 1.5rem;
		color: var(--color-text-primary, white);
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
		max-height: 50vh;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.setting-toggle-button {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		background-color: var(--tkc-button-panel-background, #2a2a2e);
		color: white;
		border: 2px solid var(--tkc-border-color, #3c3c41);
		transition: all 0.2s ease;
		font-weight: bold;
		position: relative;
		overflow: hidden;
	}

	.setting-toggle-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.setting-toggle-button.active {
		background: linear-gradient(135deg, #167bf4, #329bff);
		border-color: #167bf4;
		box-shadow: 0 0 10px rgba(22, 123, 244, 0.5);
	}

	.setting-toggle-button.active::before {
		content: '✓';
		position: absolute;
		top: 0.25rem;
		right: 0.5rem;
		font-size: 0.75rem;
		color: white;
		opacity: 0.8;
	}

	.setting-toggle-button:not(.active)::before {
		content: '✕';
		position: absolute;
		top: 0.25rem;
		right: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		opacity: 0.5;
	}

	.color-picker,
	.quality-slider {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-text-primary, white);
	}

	input[type='range'] {
		width: 100%;
		max-width: 400px;
	}

	input[type='color'] {
		width: 100px;
		height: 40px;
		border-radius: 4px;
		border: 2px solid var(--tkc-border-color, #3c3c41);
	}

	.reset-container {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
	}

	.reset-button {
		background-color: var(--tkc-button-panel-background, #2a2a2e);
		color: var(--color-text-primary, white);
		border: 2px solid var(--tkc-border-color, #3c3c41);
		border-radius: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-weight: bold;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.reset-button:hover {
		background-color: var(--tkc-button-panel-background-hover, #3c3c41);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.reset-button:active {
		transform: translateY(0);
		box-shadow: none;
	}
</style>
