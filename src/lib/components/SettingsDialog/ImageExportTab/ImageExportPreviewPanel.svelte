<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import { exportEnhancedImage } from '$lib/components/Pictograph/export/enhancedImageExporter';
	import type { ImageExportSettings } from '$lib/state/image-export-settings';

	// Props
	const { settings } = $props<{
		settings: ImageExportSettings;
	}>();

	// Local state
	let previewElement = $state<HTMLDivElement | null>(null);
	let previewImage = $state<string | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let lastUpdateTime = $state<number>(0);
	let updateTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let lastSettingsHash = $state<string>('');
	let cachedPreview = $state<string | null>(null);

	// Use the sequence container
	const sequence = useContainer(sequenceContainer);

	// Get the current sequence data
	const sequenceBeats = $derived(sequence.beats || []);

	// Get the start position from localStorage
	let startPosition = $state<any>(null);

	$effect(() => {
		if (browser) {
			try {
				const savedStartPos = localStorage.getItem('start_position');
				if (savedStartPos) {
					startPosition = JSON.parse(savedStartPos);
				}
			} catch (error) {
				console.error('Failed to load start position from localStorage:', error);
			}
		}
	});

	// Update the preview when settings or sequence changes
	$effect(() => {
		if (browser && previewElement) {
			// Calculate a hash of the current settings and sequence state
			// This will automatically track all dependencies
			const currentHash = calculateSettingsHash();

			// Only update if something has changed or we don't have a preview yet
			if (currentHash !== lastSettingsHash || !previewImage) {
				// Debounce updates to avoid excessive renders
				debouncedUpdatePreview();
			}
		}
	});

	// Handle window resize
	function handleResize() {
		if (browser && previewElement) {
			debouncedUpdatePreview();
		}
	}

	// Update the preview when the component mounts
	onMount(() => {
		if (browser) {
			window.addEventListener('resize', handleResize);

			if (previewElement) {
				updatePreview();
			}
		}

		return () => {
			if (browser) {
				window.removeEventListener('resize', handleResize);
			}

			if (updateTimer) {
				clearTimeout(updateTimer);
			}
		};
	});

	// Calculate a hash of the current settings and sequence state
	function calculateSettingsHash(): string {
		// Create a string representation of all the settings and sequence data
		const hashInput = JSON.stringify({
			includeStartPosition: settings.includeStartPosition,
			addUserInfo: settings.addUserInfo,
			addWord: settings.addWord,
			addDifficultyLevel: settings.addDifficultyLevel,
			addBeatNumbers: settings.addBeatNumbers,
			addReversalSymbols: settings.addReversalSymbols,
			userName: settings.userName,
			customNote: settings.customNote,
			sequenceLength: sequenceBeats.length,
			sequenceTitle: sequence.metadata?.name || '',
			difficultyLevel: sequence.metadata?.difficulty || 1,
			hasStartPosition: !!startPosition
		});

		// Simple hash function
		let hash = 0;
		for (let i = 0; i < hashInput.length; i++) {
			const char = hashInput.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash.toString();
	}

	// Debounce preview updates to avoid excessive renders
	function debouncedUpdatePreview() {
		const now = Date.now();
		const currentHash = calculateSettingsHash();

		// If we're already loading, don't schedule another update
		if (isLoading) {
			return;
		}

		// If settings haven't changed, use cached preview if available
		if (currentHash === lastSettingsHash && cachedPreview) {
			previewImage = cachedPreview;
			return;
		}

		// Update the hash
		lastSettingsHash = currentHash;

		// If it's been less than 800ms since the last update, debounce
		if (now - lastUpdateTime < 800) {
			if (updateTimer) {
				clearTimeout(updateTimer);
			}

			updateTimer = setTimeout(() => {
				updatePreview();
				updateTimer = null;
			}, 800);
		} else {
			// Otherwise, update immediately
			updatePreview();
		}
	}

	// Update the preview image
	async function updatePreview() {
		// Skip if not in browser or no preview element
		if (!browser || !previewElement) {
			return;
		}

		// Skip if sequence is empty
		if (!sequenceBeats || sequenceBeats.length === 0) {
			previewImage = null;
			error = 'No sequence to preview. Add beats to see a preview.';
			return;
		}

		try {
			isLoading = true;
			error = null;
			lastUpdateTime = Date.now();

			// Get the preview element dimensions
			const width = previewElement.clientWidth;
			const height = previewElement.clientHeight;

			// Skip if dimensions are too small
			if (width < 50 || height < 50) {
				return;
			}

			// Find the actual BeatFrame element in the DOM
			const beatFrameElement = document.querySelector('.beat-frame-container');
			if (!beatFrameElement) {
				console.error('Could not find BeatFrame element in the DOM');
				throw new Error('Could not find BeatFrame element');
			}

			// Log what we found
			console.log('Found BeatFrame element:', beatFrameElement);
			console.log('BeatFrame SVG elements:', beatFrameElement.querySelectorAll('svg').length);

			// Create a temporary element for rendering
			const tempElement = document.createElement('div');
			tempElement.style.position = 'absolute';
			tempElement.style.left = '-9999px';
			tempElement.style.width = `${width}px`;
			tempElement.style.height = `${height}px`;
			document.body.appendChild(tempElement);

			// Clone the BeatFrame content into our temporary element
			// This ensures we have all the SVG elements needed for rendering
			tempElement.innerHTML = beatFrameElement.innerHTML;

			// Get the sequence metadata
			const sequenceTitle = sequence.metadata?.name || 'Sequence';
			const difficultyLevel = sequence.metadata?.difficulty || 1;

			// Log preview generation details
			console.log('Generating preview with settings:', {
				sequenceTitle,
				difficultyLevel,
				beatsCount: sequenceBeats.length,
				hasStartPosition: !!startPosition,
				settings,
				svgCount: tempElement.querySelectorAll('svg').length
			});

			// Make sure we have SVG elements
			if (tempElement.querySelectorAll('svg').length === 0) {
				console.error('No SVG elements found in the cloned BeatFrame');
				throw new Error('No SVG elements found for rendering');
			}

			// Export the sequence with current settings
			const result = await exportEnhancedImage(tempElement, {
				beats: sequenceBeats as any,
				startPosition: startPosition as any,
				backgroundColor: '#FFFFFF', // Always use white for better contrast
				scale: 1.5, // Scale for preview quality
				quality: 1.0, // Always use maximum quality
				format: 'png', // PNG format for lossless quality
				// Use dynamic columns based on sequence length
				columns: sequenceBeats.length <= 4 ? sequenceBeats.length : 4,
				spacing: 0,
				// Apply all settings from the UI
				includeStartPosition: settings.includeStartPosition,
				addUserInfo: settings.addUserInfo,
				addWord: settings.addWord,
				addDifficultyLevel: settings.addDifficultyLevel,
				addBeatNumbers: settings.addBeatNumbers,
				addReversalSymbols: settings.addReversalSymbols,
				// Pass sequence metadata
				title: sequenceTitle,
				userName: settings.userName,
				notes: settings.customNote,
				exportDate: new Date().toLocaleDateString(),
				difficultyLevel: difficultyLevel
			});

			// Clean up the temporary element
			document.body.removeChild(tempElement);

			// Update the preview image
			if (result && result.dataUrl) {
				previewImage = result.dataUrl;
				// Cache the preview for future use
				cachedPreview = result.dataUrl;
			} else {
				throw new Error('Failed to generate preview image');
			}
		} catch (err) {
			console.error('Error generating preview:', err);
			error =
				'Failed to generate preview image: ' + (err instanceof Error ? err.message : String(err));
			previewImage = null;
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="preview-panel" bind:this={previewElement}>
	{#if isLoading}
		<div class="loading-container">
			<div class="spinner"></div>
			<p>Generating preview...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<i class="fa-solid fa-exclamation-triangle"></i>
			<p>{error}</p>

			{#if sequenceBeats.length === 0}
				<div class="help-text">
					Create a sequence to see a preview of how it will look when exported.
				</div>
			{:else}
				<div class="help-text">
					Try refreshing the page or creating a new sequence. If the problem persists, check the
					browser console for more details.
				</div>
				<button class="retry-button" onclick={updatePreview}>
					<i class="fa-solid fa-sync"></i> Retry
				</button>
			{/if}
		</div>
	{:else if previewImage}
		<img src={previewImage} alt="Sequence preview" class="preview-image" />
	{:else}
		<div class="placeholder-container">
			<i class="fa-solid fa-image"></i>
			<p>Preview will appear here</p>
		</div>
	{/if}
</div>

<style>
	.preview-panel {
		background: linear-gradient(135deg, #1f1f24, #2a2a30);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		min-height: 350px;
		width: 100%;
		position: relative;
		flex: 1;
		box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
		padding: 0; /* No padding to maximize space */
	}

	.preview-image {
		width: 100%; /* Fill the entire container width */
		height: 100%; /* Fill the entire container height */
		object-fit: contain; /* Maintain aspect ratio while filling container */
		object-position: center; /* Center the image */
		border-radius: 0; /* No border radius to maximize space */
		box-shadow: none; /* Remove shadow to maximize space */
		margin: 0; /* No margins to maximize space */
		display: block; /* Ensure proper display */
	}

	.loading-container,
	.error-container,
	.placeholder-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-left-color: #167bf4;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-container i,
	.placeholder-container i {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.error-container {
		color: #ff6b6b;
	}

	.error-container i {
		color: #ff6b6b;
	}

	.help-text {
		margin-top: 1rem;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.5);
		max-width: 300px;
		line-height: 1.4;
	}

	.retry-button {
		margin-top: 1.5rem;
		background: linear-gradient(to bottom, #3a3a43, #2a2a2e);
		color: var(--color-text-primary, white);
		border: 2px solid var(--tkc-border-color, #3c3c41);
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-weight: bold;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.retry-button:hover {
		background: linear-gradient(to bottom, #454550, #323238);
		transform: translateY(-2px);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
	}

	.retry-button:active {
		transform: translateY(0);
		background: linear-gradient(to bottom, #2a2a30, #1e1e22);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
</style>
