<!-- src/lib/components/SettingsDialog/ImageExportTab/PreviewStateManager.svelte -->
<script lang="ts" module>
	// Export the interface for the component
	export interface PreviewStateManager {
		getState: () => {
			initialUpdateTriggered: boolean;
			settingsSnapshot: Record<string, any>;
			sequenceSnapshot: Record<string, any>;
			startPosition: any;
		};
		forceUpdate: () => void;
	}
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import {
		verifyBeatFrameElements,
		calculateSettingsHash
	} from '$lib/components/SequenceWorkbench/BeatFrame/beatFrameHelpers';
	import type { ImageExportSettings } from '$lib/state/image-export-settings.svelte';

	// Props
	const { settings, onUpdatePreview } = $props<{
		settings: ImageExportSettings;
		onUpdatePreview: () => void;
	}>();

	// Local state
	let initialUpdateTriggered = $state(false);
	let previousEffectHash = $state<string | null>(null);
	let lastSettingsHash = $state<string>('');
	let beatFrameVerificationAttempts = $state(0);
	let lastDebounceRequestTime = $state(0);
	let updateTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	// Constants
	const MAX_VERIFICATION_ATTEMPTS = 5;

	// Use the sequence container
	const sequence = useContainer(sequenceContainer);

	// Get the current sequence data
	const sequenceBeats = $derived(sequence.beats || []);

	// Get the start position from localStorage
	let startPosition = $state<any>(null);

	// Create a stable derived value for settings to prevent unnecessary re-renders
	const settingsSnapshot = $derived({
		includeStartPosition: settings.includeStartPosition,
		addUserInfo: settings.addUserInfo,
		addWord: settings.addWord,
		addDifficultyLevel: settings.addDifficultyLevel,
		addBeatNumbers: settings.addBeatNumbers,
		addReversalSymbols: settings.addReversalSymbols,
		userName: settings.userName,
		customNote: settings.customNote,
		defaultCategory: settings.defaultCategory
	});

	// Create a stable derived value for sequence data
	const sequenceSnapshot = $derived({
		beatsLength: sequenceBeats.length,
		title: sequence.metadata?.name || '',
		difficulty: sequence.metadata?.difficulty || 1,
		hasStartPosition: !!startPosition
	});

	// Load start position from localStorage
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

	// Update the preview when settings or sequence changes - with safeguards against infinite loops
	$effect(() => {
		// Skip if not in browser or initialization not complete
		if (!browser || !initialUpdateTriggered) return;

		// Calculate a hash of the current settings and sequence state
		const currentHash = calculateSettingsHash(settingsSnapshot, sequenceSnapshot);

		// Guard against infinite loops - only proceed if the hash has actually changed
		// or if we haven't processed this hash before
		if (currentHash === previousEffectHash) {
			console.log('🛑 Preventing infinite loop - hash unchanged:', currentHash);
			return;
		}

		// Update the previous hash
		previousEffectHash = currentHash;

		console.log('🔄 Effect triggered with new hash:', {
			currentHash,
			lastSettingsHash,
			isDifferent: currentHash !== lastSettingsHash
		});

		// Only update if something has changed
		if (currentHash !== lastSettingsHash) {
			console.log('✅ Effect triggering update: settings changed');
			// Debounce updates to avoid excessive renders
			debouncedUpdatePreview();
		} else {
			console.log('❌ Effect NOT triggering update: hash unchanged');
		}
	});

	// Function to attempt initial preview with verification
	function attemptInitialPreview() {
		beatFrameVerificationAttempts++;
		console.log(`🔄 Attempt #${beatFrameVerificationAttempts} to verify BeatFrame elements`);

		if (verifyBeatFrameElements() || beatFrameVerificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
			console.log('🚀 BeatFrame elements verified, generating initial preview');
			initialUpdateTriggered = true;

			// Set the initial hash to prevent immediate re-renders
			const initialHash = calculateSettingsHash(settingsSnapshot, sequenceSnapshot);
			previousEffectHash = initialHash;
			lastSettingsHash = initialHash;

			// Directly call update without debouncing for initial load
			onUpdatePreview();
		} else {
			// Try again with increasing delay
			const delay = beatFrameVerificationAttempts * 100;
			console.log(`⏱️ BeatFrame elements not ready, trying again in ${delay}ms`);
			setTimeout(attemptInitialPreview, delay);
		}
	}

	// Debounce preview updates to avoid excessive renders
	function debouncedUpdatePreview() {
		const now = Date.now();

		// Prevent multiple calls within a short time period (100ms)
		if (now - lastDebounceRequestTime < 100) {
			console.log('🔄 Debounce request too frequent, ignoring');
			return;
		}

		// Update the last request time
		lastDebounceRequestTime = now;

		console.log('🕒 debouncedUpdatePreview called', {
			timestamp: new Date().toISOString()
		});

		const currentHash = calculateSettingsHash(settingsSnapshot, sequenceSnapshot);

		// Update the hash
		lastSettingsHash = currentHash;

		// Always use debouncing to prevent multiple rapid updates
		if (updateTimer) {
			console.log('⏱️ Clearing existing update timer');
			clearTimeout(updateTimer);
		}

		console.log('⏱️ Setting new update timer (800ms)');
		// Use a longer debounce time (800ms) to ensure stability
		updateTimer = setTimeout(() => {
			console.log('⏰ Timer fired, calling updatePreview()');
			onUpdatePreview();
			updateTimer = null;
		}, 800);
	}

	// Handle window resize
	function handleResize() {
		if (browser && initialUpdateTriggered) {
			debouncedUpdatePreview();
		}
	}

	// Initialize when component mounts
	onMount(() => {
		if (browser) {
			console.log('🔄 PreviewStateManager mounted');
			window.addEventListener('resize', handleResize);

			// Use a longer initial delay to ensure the DOM is fully ready
			setTimeout(() => {
				// Only trigger the initial update once from here
				if (!initialUpdateTriggered) {
					console.log('🔍 Starting BeatFrame element verification');
					attemptInitialPreview();
				}
			}, 500); // Increased initial delay
		}
	});

	// Clean up when component is destroyed
	onDestroy(() => {
		console.log('🧹 PreviewStateManager cleanup');

		if (browser) {
			window.removeEventListener('resize', handleResize);
		}

		// Clear any pending timers
		if (updateTimer) {
			clearTimeout(updateTimer);
			updateTimer = null;
		}

		// Reset state to prevent issues if the component is remounted
		initialUpdateTriggered = false;
		previousEffectHash = null;
		beatFrameVerificationAttempts = 0;
	});

	// Expose the current state and settings for parent components
	export function getState() {
		return {
			initialUpdateTriggered,
			settingsSnapshot,
			sequenceSnapshot,
			startPosition
		};
	}

	// Expose a method to force an update
	export function forceUpdate() {
		if (browser && initialUpdateTriggered) {
			onUpdatePreview();
		}
	}
</script>

<!-- This is an invisible component that just manages preview state lifecycle -->
<div style="display: none;" aria-hidden="true">
	<!-- Status for debugging -->
	{#if initialUpdateTriggered}
		<!-- Preview state manager initialized -->
	{/if}
</div>
