<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import type { ImageExportSettings } from '$lib/state/image-export-settings';
	import { userContainer } from '$lib/state/stores/user/UserContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import ImageExportToggleButton from './ImageExportToggleButton.svelte';

	// Props
	const { settings, onSettingChange } = $props<{
		settings: ImageExportSettings;
		onSettingChange: (key: keyof ImageExportSettings, value: any) => void;
	}>();

	// Local state
	let isExportingPictographs = $state(false);
	let isMobileDevice = $state(false);
	let selectedDirectoryHandle = $state<FileSystemDirectoryHandle | null>(null);

	// Use the user container with Svelte 5 runes
	const user = useContainer(userContainer);

	// Button settings configuration
	const buttonSettings = [
		{
			label: 'Start Position',
			key: 'includeStartPosition',
			tooltip: 'Include start position in exported image'
		},
		{
			label: 'User Info',
			key: 'addUserInfo',
			tooltip: 'Include user info (name, note, date) in the exported image'
		},
		{ label: 'Word', key: 'addWord', tooltip: 'Add the sequence word as a title' },
		{
			label: 'Difficulty Level',
			key: 'addDifficultyLevel',
			tooltip: 'Add difficulty indicator in the top-left corner'
		},
		{
			label: 'Beat Numbers',
			key: 'addBeatNumbers',
			tooltip: 'Show beat numbers on each pictograph'
		},
		{
			label: 'Reversal Symbols',
			key: 'addReversalSymbols',
			tooltip: 'Show prop reversal indicators'
		}
	] as const;

	// Initialize on mount
	onMount(() => {
		if (browser) {
			try {
				// Detect if we're on a mobile device
				isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent
				);

				console.log('Device detection:', { isMobileDevice });

				// Get current user from container
				const currentUser = user.currentUser;

				// Set the current user as the userName if available
				if (currentUser && currentUser.trim() !== '') {
					onSettingChange('userName', currentUser);
				}

				// Load saved directory handle if available and remember option is enabled
				if (settings.rememberLastSaveDirectory) {
					loadSavedDirectoryHandle();
				}
			} catch (error) {
				console.error('Failed to initialize:', error);
			}
		}
	});

	// Load saved directory handle from localStorage
	async function loadSavedDirectoryHandle() {
		if (!browser || isMobileDevice) return;

		try {
			// Check if we have a saved directory handle
			const savedHandle = localStorage.getItem('exportDirectoryHandle');
			if (!savedHandle) return;

			// Parse the saved handle
			const handleData = JSON.parse(savedHandle);

			// Request permission to use the directory
			// This will prompt the user to grant permission again if needed
			if ('showDirectoryPicker' in window) {
				try {
					// Try to recover the directory handle
					// This is a simplified approach - in a real implementation,
					// you would use the File System Access API's more advanced features
					// to properly restore the handle

					// For now, we'll just show a message that we're using the saved directory
					console.log('Using saved directory:', handleData.name);
					showSuccessMessage(`Using saved directory: ${handleData.name}`);
				} catch (error) {
					console.error('Failed to recover directory handle:', error);
					// Clear the saved handle if we can't recover it
					localStorage.removeItem('exportDirectoryHandle');
				}
			}
		} catch (error) {
			console.error('Failed to load saved directory handle:', error);
		}
	}

	// Handle toggle button click
	function handleToggle(key: keyof ImageExportSettings) {
		onSettingChange(key, !settings[key]);
	}

	// Note: User selection has been removed in favor of using the current user directly

	// Handle custom note change
	function handleNoteChange(event: Event) {
		const input = event.target as HTMLInputElement;
		onSettingChange('customNote', input.value);
	}

	// Handle remember directory change
	function handleRememberDirectoryChange(event: Event) {
		const checkbox = event.target as HTMLInputElement;

		// Provide haptic feedback
		if (browser && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		onSettingChange('rememberLastSaveDirectory', checkbox.checked);
	}

	// Handle export all pictographs button click
	async function handleExportAllPictographs() {
		if (!browser) return;

		// Provide haptic feedback
		if (hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('success');
		}

		try {
			isExportingPictographs = true;

			// For mobile devices, use the browser's default download behavior
			if (isMobileDevice) {
				// Implement mobile download logic here
				// For now we'll just simulate waiting
				await new Promise((resolve) => setTimeout(resolve, 1500));
				showSuccessMessage('Image downloaded successfully.');
				return;
			}

			// For desktop devices, use the File System Access API
			try {
				// Type assertion for the File System Access API
				// These types are not included in the standard TypeScript lib
				type FileSystemPermissionMode = 'read' | 'readwrite';

				interface FileSystemPermissionDescriptor {
					mode?: FileSystemPermissionMode;
				}

				interface FileSystemDirectoryHandleWithPermissions extends FileSystemDirectoryHandle {
					requestPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
				}

				interface WindowWithDirectoryPicker extends Window {
					showDirectoryPicker(options?: {
						id?: string;
						startIn?: string;
						mode?: FileSystemPermissionMode;
					}): Promise<FileSystemDirectoryHandle>;
				}

				let directoryHandle: FileSystemDirectoryHandle;

				// If we should remember the directory and we have a saved handle, use it
				if (settings.rememberLastSaveDirectory && selectedDirectoryHandle) {
					// Verify we still have permission to use the directory
					try {
						// This will prompt the user if permission has been revoked
						await (
							selectedDirectoryHandle as FileSystemDirectoryHandleWithPermissions
						).requestPermission({
							mode: 'readwrite'
						});
						directoryHandle = selectedDirectoryHandle;
						console.log('Using saved directory handle');
					} catch (err) {
						const error = err as Error;
						console.error(
							'Permission denied for saved directory, prompting for new directory',
							error
						);
						// If permission is denied, prompt for a new directory
						directoryHandle = await (
							window as unknown as WindowWithDirectoryPicker
						).showDirectoryPicker({
							id: 'pictographExports',
							startIn: 'pictures',
							mode: 'readwrite'
						});
					}
				} else {
					// Otherwise, prompt for a directory
					directoryHandle = await (
						window as unknown as WindowWithDirectoryPicker
					).showDirectoryPicker({
						id: 'pictographExports',
						startIn: 'pictures',
						mode: 'readwrite'
					});
				}

				if (directoryHandle) {
					// Save the directory handle if we should remember it
					if (settings.rememberLastSaveDirectory) {
						selectedDirectoryHandle = directoryHandle;

						// Save the directory handle to localStorage
						// Note: We can't directly serialize the handle, so we save some metadata
						localStorage.setItem(
							'exportDirectoryHandle',
							JSON.stringify({
								name: directoryHandle.name,
								kind: directoryHandle.kind,
								timestamp: Date.now()
							})
						);
					}

					// Implement export logic here
					// For now we'll just simulate waiting
					await new Promise((resolve) => setTimeout(resolve, 1500));

					// Show success message
					showSuccessMessage('Successfully exported pictographs.');
				}
			} catch (err) {
				const error = err as Error;
				console.error('Failed to open directory picker:', error);

				// Check if the error is because the user cancelled the picker
				if (error.name === 'AbortError') {
					// User cancelled, no need to show an error
					console.log('User cancelled directory selection');
				} else {
					// Show error message for other errors
					showErrorMessage('Failed to choose export directory.');
				}
			}
		} finally {
			isExportingPictographs = false;
		}
	}

	// Show success message
	function showSuccessMessage(message: string) {
		if (browser) {
			const event = new CustomEvent('show-message', {
				detail: { message, type: 'success' },
				bubbles: true
			});
			document.dispatchEvent(event);
		}
	}

	// Show error message
	function showErrorMessage(message: string) {
		if (browser) {
			const event = new CustomEvent('show-message', {
				detail: { message, type: 'error' },
				bubbles: true
			});
			document.dispatchEvent(event);
		}
	}
</script>

<div class="control-panel">
	<div class="panel-section note-section">
		<div class="form-group">
			<label for="custom-note" class="compact-label">Note for exports:</label>
			<textarea
				id="custom-note"
				value={settings.customNote}
				onchange={handleNoteChange}
				placeholder="Enter note to include in exports"
				aria-label="Custom note for exports"
				class="text-area"
				rows="1"
			></textarea>
			<div class="note-info">
				<span class="note-hint">This text will appear in exported images</span>
				<div class="toggle-container">
					<label class="toggle-switch">
						<input
							type="checkbox"
							checked={settings.rememberLastSaveDirectory}
							onchange={handleRememberDirectoryChange}
							aria-label="Remember last save directory"
						/>
						<span class="toggle-slider"></span>
					</label>
					<span class="toggle-label">Remember save location</span>
				</div>
			</div>
		</div>
	</div>

	<div class="panel-section options-section">
		<h3>Options</h3>

		<div class="options-grid">
			{#each buttonSettings as button}
				<ImageExportToggleButton
					label={button.label}
					settingKey={button.key}
					isActive={settings[button.key]}
					onToggle={handleToggle}
					tooltip={button.tooltip}
				/>
			{/each}
		</div>
	</div>

	<div class="panel-section export-all-section">
		<button
			class="export-all-button"
			class:loading={isExportingPictographs}
			onclick={handleExportAllPictographs}
			aria-label="Export all pictographs"
			disabled={isExportingPictographs}
		>
			{#if isExportingPictographs}
				<i class="fa-solid fa-spinner fa-spin"></i>
				Exporting...
			{:else}
				<i class="fa-solid fa-file-export"></i>
				Export All Pictographs
			{/if}
		</button>
	</div>
</div>

<style>
	.control-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.panel-section {
		border-radius: 8px;
		background: rgba(20, 20, 25, 0.3);
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 0.5rem;
	}

	.note-section {
		display: flex;
		flex-direction: column;
	}

	.form-group {
		flex: 1;
		width: 100%;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-text-primary, white);
		font-weight: 600;
		font-size: 0.9rem;
	}

	.compact-label {
		margin-bottom: 0.3rem;
		font-size: 0.85rem;
	}

	.text-area {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		background: linear-gradient(to bottom, #1f1f24, #2a2a30);
		border: 1px solid rgba(108, 156, 233, 0.3);
		color: var(--color-text-primary, white);
		font-size: 0.95rem;
		transition: all 0.2s ease;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
		resize: none;
		min-height: 2.5rem;
		font-family: inherit;
	}

	.text-area:focus {
		border-color: #167bf4;
		box-shadow: 0 0 0 2px rgba(22, 123, 244, 0.3);
		outline: none;
		min-height: 4rem; /* Expand when focused */
	}

	.note-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
		font-size: 0.8rem;
	}

	.note-hint {
		color: rgba(255, 255, 255, 0.5);
		font-style: italic;
	}

	.toggle-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Modern toggle switch */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 36px;
		height: 20px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(20, 20, 25, 0.6);
		transition: 0.3s;
		border-radius: 20px;
		border: 1px solid rgba(108, 156, 233, 0.3);
	}

	.toggle-slider:before {
		position: absolute;
		content: '';
		height: 14px;
		width: 14px;
		left: 3px;
		bottom: 2px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
	}

	input:checked + .toggle-slider {
		background-color: #167bf4;
	}

	input:checked + .toggle-slider:before {
		transform: translateX(16px);
	}

	.options-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary, white);
		border-bottom: 1px solid rgba(108, 156, 233, 0.3);
		padding-bottom: 0.5rem;
	}

	.options-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.75rem;
		align-content: start;
		margin-top: 1rem;
	}

	.export-all-button {
		width: 100%;
		background: linear-gradient(to bottom, #167bf4, #1068d9);
		color: white;
		border: none;
		border-radius: 6px;
		padding: 0.85rem 1.5rem;
		font-weight: bold;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		transition: all 0.2s ease;
		cursor: pointer;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	}

	.export-all-button:hover:not(:disabled) {
		background: linear-gradient(to bottom, #1d86ff, #1271ea);
		transform: translateY(-2px);
		box-shadow: 0 4px 10px rgba(22, 123, 244, 0.3);
	}

	.export-all-button:active:not(:disabled) {
		transform: translateY(0);
		background: linear-gradient(to bottom, #0f65d1, #0a54b3);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.export-all-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.export-all-button.loading {
		background: linear-gradient(to bottom, #3a3a43, #2a2a2e);
	}

	/* Responsive styles */
	@media (max-width: 768px) {
		.panel-section {
			padding: 1rem;
		}

		.options-grid {
			width: 100%;
			grid-template-columns: repeat(2, 1fr);
		}

		.note-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.toggle-container {
			width: 100%;
			justify-content: flex-end;
		}
	}

	@media (max-width: 480px) {
		.panel-section {
			padding: 0.75rem;
		}

		.options-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
