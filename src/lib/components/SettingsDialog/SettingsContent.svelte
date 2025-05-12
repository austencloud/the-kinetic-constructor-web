<script lang="ts">
	import { appActions } from '$lib/state/machines/app/app.actions';
	import { appService } from '$lib/state/machines/app/app.machine';
	import { onMount } from 'svelte';
	import HapticFeedbackSetting from '$lib/components/Settings/HapticFeedbackSetting.svelte';
	import ImageExportTab from './ImageExportTab/ImageExportTab.svelte';

	// Define better types for our settings
	type BaseSetting = {
		label: string;
	};

	type ToggleSetting = BaseSetting & {
		type: 'toggle';
		defaultValue: boolean;
	};

	type NumberSetting = BaseSetting & {
		type: 'number';
		defaultValue: number;
		min: number;
		max: number;
	};

	type RangeSetting = BaseSetting & {
		type: 'range';
		defaultValue: number;
		min: number;
		max: number;
	};

	type SelectSetting = BaseSetting & {
		type: 'select';
		defaultValue: string;
		options: string[];
	};

	type TextSetting = BaseSetting & {
		type: 'text';
		defaultValue: string;
	};

	type ColorSetting = BaseSetting & {
		type: 'color';
		defaultValue: string;
	};

	type CustomSetting = BaseSetting & {
		type: 'custom';
		component: string;
		defaultValue?: any; // Optional default value for custom components
	};

	// Union type of all settings
	type Setting =
		| ToggleSetting
		| NumberSetting
		| RangeSetting
		| SelectSetting
		| TextSetting
		| ColorSetting
		| CustomSetting;

	// Define a single settings list with minimal placeholder settings
	const settings: Setting[] = [
		{
			label: 'Background Type',
			type: 'select',
			options: ['Snowfall', 'Night Sky'],
			defaultValue: 'Snowfall'
		}
		// { label: 'Show Grid', type: 'toggle', defaultValue: true },
		// { label: 'Dark Mode', type: 'toggle', defaultValue: true }
	];

	// PropsAbsolute angel an absolute angel You
	export let onClose: () => void;

	// State
	let searchQuery = '';
	let hasUnsavedChanges = false;
	let settingsValues: Record<string, any> = {};

	// Initialize settings
	onMount(() => {
		// Initialize settings values from defaults
		settingsValues = settings.reduce<Record<string, any>>((acc, setting) => {
			acc[setting.label] = setting.defaultValue;
			return acc;
		}, {});

		// Get current background from app state
		const currentState = appService.getSnapshot();
		const currentBackground = currentState.context.background;
		console.log('Current background from app state:', currentBackground);

		// Find the matching background option
		if (currentBackground) {
			// Find the matching option in our settings
			// Type assertion to access options property
			const backgroundSetting = settings[0] as SelectSetting;
			console.log('Available background options:', backgroundSetting.options);

			let backgroundOption;

			// Direct mapping for known types
			if (currentBackground === 'snowfall') {
				backgroundOption = 'Snowfall';
			} else if (currentBackground === 'nightSky') {
				backgroundOption = 'Night Sky';
			} else {
				// Fallback to search
				backgroundOption = backgroundSetting.options.find(
					(opt: string) => opt.toLowerCase().replace(/\s+/g, '') === currentBackground.toLowerCase()
				);
			}

			console.log('Selected background option:', backgroundOption);

			if (backgroundOption) {
				settingsValues['Background Type'] = backgroundOption;
				console.log('Set initial background value to:', backgroundOption);
			}
		}
	});

	// Save changes
	function handleSave() {
		// Apply settings
		console.log('Saving settings:', settingsValues);

		// Handle background type change
		if (settingsValues['Background Type']) {
			// Direct mapping from display name to internal name
			let backgroundType: string;

			// Map display names to internal types
			switch (settingsValues['Background Type']) {
				case 'Snowfall':
					backgroundType = 'snowfall';
					break;
				case 'Night Sky':
					backgroundType = 'nightSky';
					break;

				default:
					backgroundType = 'snowfall'; // Default fallback
			}

			console.log('Selected background:', settingsValues['Background Type']);
			console.log('Mapped to internal type:', backgroundType);

			// Update the background
			if (['snowfall', 'nightSky', 'summerDay'].includes(backgroundType)) {
				console.log('Updating background to:', backgroundType);
				appActions.updateBackground(backgroundType as any);

				// Dispatch a change event to update the UI
				if (typeof window !== 'undefined') {
					const event = new CustomEvent('changeBackground', {
						detail: backgroundType,
						bubbles: true
					});
					window.dispatchEvent(event);
				}
			} else {
				console.warn('Invalid background type:', backgroundType);
			}
		}

		// We'll use a custom event instead of dispatch
		if (typeof window !== 'undefined') {
			const saveEvent = new CustomEvent('save', { detail: settingsValues });
			window.dispatchEvent(saveEvent);
		}
		hasUnsavedChanges = false;
	}

	// Reset to defaults
	function handleReset() {
		// Reset all settings to their default values
		settingsValues = settings.reduce<Record<string, any>>((acc, setting) => {
			acc[setting.label] = setting.defaultValue;
			return acc;
		}, {});

		// Apply default background
		appActions.updateBackground('snowfall');

		// Dispatch a change event to update the UI
		if (typeof window !== 'undefined') {
			const backgroundEvent = new CustomEvent('changeBackground', {
				detail: 'snowfall',
				bubbles: true
			});
			window.dispatchEvent(backgroundEvent);
		}

		// Placeholder: Implement actual reset logic if needed beyond local state
		console.log('Resetting settings');
		// We'll use a custom event instead of dispatch
		if (typeof window !== 'undefined') {
			const resetEvent = new CustomEvent('reset', { detail: { settings: settingsValues } });
			window.dispatchEvent(resetEvent);
		}
		hasUnsavedChanges = false;
	}

	// Track changes
	function markUnsavedChanges() {
		hasUnsavedChanges = true;
	}
</script>

<div class="settings-container" role="dialog" aria-modal="true" aria-labelledby="settings-title-h2">
	<div class="settings-header">
		<div class="settings-title">
			<i class="fa-solid fa-gear icon-style text-sky-400"></i>
			<h2 id="settings-title-h2" class="text-xl font-semibold text-slate-100">Settings</h2>
		</div>

		<div class="settings-actions">
			<div class="search-container">
				<input type="text" placeholder="Search..." bind:value={searchQuery} class="search-input" />
				<i class="fa-solid fa-magnifying-glass search-icon"></i>
			</div>

			<button on:click={onClose} class="close-button" aria-label="Close settings">
				<i class="fa-solid fa-xmark icon-style-button"></i>
			</button>
		</div>
	</div>

	<div class="settings-content">
		<div class="section-settings">
			<!-- Mobile Settings Section -->
			<div class="section-header">
				<h3>Mobile Experience</h3>
			</div>
			<div class="mobile-settings">
				<HapticFeedbackSetting />
			</div>

			<!-- Image Export Settings Section -->
			<div class="section-header">
				<h3>Image Export</h3>
			</div>
			<div class="image-export-settings">
				<ImageExportTab />
			</div>

			<!-- Visual Settings Section -->
			<div class="section-header">
				<h3>Visual Settings</h3>
			</div>
			<div class="section-settings-grid">
				{#each settings as setting (setting.label)}
					{@const lowerCaseLabel = setting.label.toLowerCase()}
					{#if !searchQuery || lowerCaseLabel.includes(searchQuery.toLowerCase())}
						<div class="setting-item">
							<label class="setting-label" for="setting-{lowerCaseLabel}">{setting.label}</label>

							{#if setting.type === 'toggle'}
								<label class="toggle-switch">
									<input
										id="setting-{lowerCaseLabel}"
										type="checkbox"
										bind:checked={settingsValues[setting.label]}
										on:change={markUnsavedChanges}
									/>
									<span class="slider"></span>
								</label>
							{:else if setting.type === 'number'}
								<input
									id="setting-{lowerCaseLabel}"
									type="number"
									bind:value={settingsValues[setting.label]}
									min={setting.min}
									max={setting.max}
									on:input={markUnsavedChanges}
									class="number-input"
								/>
							{:else if setting.type === 'range'}
								<div class="range-container">
									<input
										id="setting-{lowerCaseLabel}"
										type="range"
										bind:value={settingsValues[setting.label]}
										min={setting.min}
										max={setting.max}
										on:input={markUnsavedChanges}
										class="range-input"
									/>
									<span class="range-value">{settingsValues[setting.label]}</span>
								</div>
							{:else if setting.type === 'select'}
								<select
									id="setting-{lowerCaseLabel}"
									bind:value={settingsValues[setting.label]}
									on:change={markUnsavedChanges}
									class="select-input"
								>
									{#each setting.options as opt}
										<option value={opt}>{opt}</option>
									{/each}
								</select>
							{:else if setting.type === 'text'}
								<input
									id="setting-{lowerCaseLabel}"
									type="text"
									bind:value={settingsValues[setting.label]}
									on:input={markUnsavedChanges}
									class="text-input"
								/>
							{:else if setting.type === 'color'}
								<div class="color-container">
									<input
										id="setting-{lowerCaseLabel}"
										type="color"
										bind:value={settingsValues[setting.label]}
										on:input={markUnsavedChanges}
										class="color-input"
									/>
									<span class="color-value">{settingsValues[setting.label]}</span>
								</div>
							{:else}
								<span>Unsupported setting type</span>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<div class="settings-footer">
		<div class="unsaved-changes">
			{#if hasUnsavedChanges}
				<p class="text-sm text-yellow-400">You have unsaved changes</p>
			{/if}
		</div>
		<div class="action-buttons">
			<button on:click={handleReset} class="reset-button">
				<i class="fa-solid fa-arrows-rotate icon-style-button-sm"></i>
				Reset to Defaults
			</button>
			<button on:click={handleSave} disabled={!hasUnsavedChanges} class="save-button">
				<i class="fa-solid fa-floppy-disk icon-style-button-sm"></i>
				Save Changes
			</button>
		</div>
	</div>
</div>

<style>
	/* --- Base Container & Layout --- */
	.settings-container {
		display: flex;
		flex-direction: column;
		height: 100%; /* Changed from 100vh to fit parent */
		width: 100%;
		background: rgba(30, 40, 60, 0.9);
		backdrop-filter: blur(10px);
		color: #e0e0e0; /* Default light text */
		border-radius: 12px; /* Match parent dialog */
		overflow: hidden; /* Prevent content spill */
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem; /* Consistent padding */
		border-bottom: 1px solid rgba(108, 156, 233, 0.2);
		flex-shrink: 0;
	}

	.settings-content {
		display: flex;
		flex: 1; /* Grow to fill available space */
		min-height: 0; /* Important for flex children */
		padding: 1.5rem;
		overflow-y: auto;
	}

	.settings-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(108, 156, 233, 0.2);
		background-color: rgba(20, 30, 50, 0.5); /* Slightly different footer bg */
		flex-shrink: 0;
	}

	/* --- Header Elements --- */
	.settings-title {
		display: flex;
		align-items: center;
		gap: 0.75rem; /* Space between icon and text */
	}
	.settings-title h2 {
		margin: 0; /* Remove default heading margin */
	}

	.settings-actions {
		display: flex;
		align-items: center;
		gap: 1rem; /* Space between search and close */
	}

	.search-container {
		position: relative;
	}

	.search-input {
		background: rgba(20, 30, 50, 0.7);
		border: 1px solid rgba(108, 156, 233, 0.2);
		color: white;
		padding: 8px 12px 8px 32px; /* Add padding for icon */
		border-radius: 6px;
		font-size: 0.9rem;
		width: 200px; /* Adjust as needed */
		transition: border-color 0.2s ease;
	}
	.search-input:focus {
		outline: none;
		border-color: #6c9ce9;
	}
	.search-input::placeholder {
		color: #a0aec0;
	}

	.search-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		color: #a0aec0;
		font-size: 0.9rem; /* Match input font size */
	}

	.close-button {
		background: transparent;
		border: none;
		color: #a0aec0;
		cursor: pointer;
		padding: 4px;
		border-radius: 50%;
		transition:
			color 0.2s ease,
			background-color 0.2s ease;
	}
	.close-button:hover {
		color: white;
		background-color: rgba(255, 255, 255, 0.1);
	}

	/* --- Icon Styling Helpers --- */
	.icon-style {
		font-size: 1.5rem; /* Adjust title icon size */
		margin-right: 0.75rem; /* Consistent gap */
		width: 24px; /* Explicit width */
		text-align: center;
	}
	.icon-style-button {
		font-size: 1.2rem; /* Adjust button icon size */
		width: 24px;
		height: 24px;
		display: inline-block; /* Ensure size is respected */
		line-height: 24px; /* Center icon vertically */
		text-align: center;
	}
	.icon-style-button-sm {
		font-size: 1rem; /* Smaller icons for footer buttons */
		margin-right: 0.5rem;
		width: 16px;
		height: 16px;
		display: inline-block;
		line-height: 16px;
		text-align: center;
	}

	/* --- Section Settings Area --- */
	.section-settings {
		flex: 1; /* Grow to fill space */
		width: 100%;
	}

	.section-header {
		margin: 1rem 0;
		border-bottom: 1px solid rgba(108, 156, 233, 0.2);
		padding-bottom: 0.5rem;
	}

	.section-header h3 {
		font-size: 1.1rem;
		font-weight: 500;
		color: #6c9ce9;
		margin: 0;
	}

	.mobile-settings,
	.image-export-settings {
		margin-bottom: 2rem;
	}

	.section-settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem; /* Increased gap */
	}

	.setting-item {
		display: flex;
		flex-wrap: wrap; /* Allow wrapping on smaller widths within grid cell */
		justify-content: space-between;
		align-items: center;
		background: rgba(20, 30, 50, 0.4); /* Slightly less opaque */
		padding: 1rem; /* Consistent padding */
		border-radius: 8px;
		border: 1px solid rgba(108, 156, 233, 0.1); /* Subtle border */
		gap: 1rem; /* Space between label and input */
	}

	.setting-label {
		color: #cbd5e0; /* Lighter label color */
		font-weight: 500;
		flex-shrink: 0; /* Prevent label from shrinking */
	}

	/* --- Input Styles --- */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 50px; /* Smaller toggle */
		height: 28px;
	}
	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}
	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #555; /* Darker off state */
		transition: 0.4s;
		border-radius: 28px;
	}
	.slider:before {
		position: absolute;
		content: '';
		height: 20px;
		width: 20px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}
	.toggle-switch input:checked + .slider {
		background-color: #3a7bd5;
	} /* Blue accent */
	.toggle-switch input:focus + .slider {
		box-shadow: 0 0 1px #3a7bd5;
	}
	.toggle-switch input:checked + .slider:before {
		transform: translateX(22px);
	} /* Adjusted translation */

	.number-input,
	.select-input,
	.text-input {
		background: rgba(30, 40, 60, 0.7);
		border: 1px solid rgba(108, 156, 233, 0.2);
		color: white;
		padding: 8px 12px;
		border-radius: 6px; /* Match search input */
		font-size: 0.9rem;
	}
	.number-input {
		width: 80px;
		text-align: right;
	} /* Fixed width for numbers */
	.select-input {
		min-width: 150px;
	} /* Minimum width for selects */
	.text-input {
		min-width: 200px;
	} /* Minimum width for text inputs */
	.number-input:focus,
	.select-input:focus,
	.text-input:focus {
		outline: none;
		border-color: #6c9ce9;
	}

	/* Color input styling */
	.color-container {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.color-input {
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		background: transparent;
	}
	.color-input::-webkit-color-swatch {
		border-radius: 4px;
		border: 1px solid rgba(108, 156, 233, 0.4);
	}
	.color-value {
		font-family: monospace;
		font-size: 0.9rem;
		color: #cbd5e0;
	}

	/* Range slider styling */
	.range-container {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%; /* Allow range to fill space */
		min-width: 200px;
	}
	.range-input {
		flex-grow: 1; /* Allow slider to take up space */
		cursor: pointer;
		accent-color: #6c9ce9; /* Style slider color */
	}
	.range-value {
		color: #cbd5e0;
		font-size: 0.9rem;
		min-width: 30px; /* Ensure space for value */
		text-align: right;
	}

	/* --- Footer Elements --- */
	.unsaved-changes {
		flex-grow: 1; /* Push action buttons to the right */
	}
	.action-buttons {
		display: flex;
		gap: 0.75rem; /* Space between buttons */
	}

	.reset-button,
	.save-button {
		display: inline-flex; /* Align icon and text */
		align-items: center;
		padding: 8px 16px; /* Consistent padding */
		border-radius: 6px;
		border: none; /* Remove default border */
		cursor: pointer;
		font-weight: 500;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.reset-button {
		background: rgba(100, 100, 110, 0.4); /* Slightly adjusted gray */
		color: #cbd5e0;
	}
	.reset-button:hover {
		background: rgba(110, 110, 120, 0.6);
	}

	.save-button {
		background: #3a7bd5; /* Blue accent */
		color: white;
	}
	.save-button:hover:not(:disabled) {
		background: #2a5da5; /* Darker blue on hover */
	}
	.save-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: #555; /* Darker disabled background */
	}
</style>
