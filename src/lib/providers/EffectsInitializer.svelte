<!-- src/lib/providers/EffectsInitializer.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, onDestroy, untrack } from 'svelte';

	/**
	 * This component initializes all the effects that need to run in a proper Svelte component context.
	 * It's used by ServiceProvider to ensure $effect runes are used correctly.
	 */

	let isInitialized = $state(false);
	let cleanupFunctions: (() => void)[] = [];

	onMount(async () => {
		if (!browser || isInitialized) return;

		try {
			// CRITICAL: Add substantial delay to avoid conflicts with other initializers
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Initialize sequence auto-save with MUCH less aggressive polling
			const { sequenceContainer } = await import(
				'$lib/state/stores/sequence/SequenceContainer.svelte'
			);

			let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
			let lastSavedState = JSON.stringify({
				beats: sequenceContainer.state.beats.length,
				metadata: sequenceContainer.state.metadata.name
			});

			const debouncedSave = () => {
				if (saveTimeoutId) {
					clearTimeout(saveTimeoutId);
				}
				saveTimeoutId = setTimeout(() => {
					const currentState = JSON.stringify({
						beats: sequenceContainer.state.beats.length,
						metadata: sequenceContainer.state.metadata.name
					});

					if (currentState !== lastSavedState) {
						untrack(() => {
							sequenceContainer.saveToLocalStorage();
						});
						lastSavedState = currentState;
					}

					saveTimeoutId = null;
				}, 1000); // Increased debounce time
			};

			// CRITICAL: Much less aggressive polling - every 5 seconds instead of 1
			const autoSaveInterval = setInterval(() => {
				if (sequenceContainer.state.isModified) {
					debouncedSave();
				}
			}, 5000); // Increased from 1000ms to 5000ms

			const handleBeforeUnload = () => {
				if (saveTimeoutId) {
					clearTimeout(saveTimeoutId);
					saveTimeoutId = null;

					const currentState = JSON.stringify({
						beats: sequenceContainer.state.beats.length,
						metadata: sequenceContainer.state.metadata.name
					});

					if (currentState !== lastSavedState && sequenceContainer.state.isModified) {
						sequenceContainer.saveToLocalStorage();
					}
				}
			};

			window.addEventListener('beforeunload', handleBeforeUnload);

			// Add cleanup functions
			cleanupFunctions.push(() => {
				clearInterval(autoSaveInterval);
				if (saveTimeoutId) clearTimeout(saveTimeoutId);
				window.removeEventListener('beforeunload', handleBeforeUnload);
			});

			// Initialize theme functionality with manual reactivity
			const { getActiveTheme, themeService } = await import('$lib/styles/themeService.svelte');

			// Theme checking every 2 seconds instead of 500ms
			let lastTheme = getActiveTheme();
			const themeInterval = setInterval(() => {
				const currentTheme = getActiveTheme();
				if (currentTheme !== lastTheme) {
					lastTheme = currentTheme;
					untrack(() => {
						themeService.applyTheme();
					});
				}
			}, 2000); // Increased from 500ms to 2000ms

			cleanupFunctions.push(() => {
				clearInterval(themeInterval);
			});

			// MIGRATED: XState sequence machine removed - using pure Svelte 5 runes now
			// No need to import sequence actor anymore

			// MIGRATED: Simplified sequence watching without XState persistence
			let hasStartPosition = false;
			try {
				// Use the new sequence state instead
				const { sequenceState } = await import('$lib/state/simple/sequenceState.svelte');
				hasStartPosition = !!sequenceState.startPosition;
			} catch (error) {
				console.warn('Error getting start position:', error);
				hasStartPosition = false;
			}

			// MIGRATED: Simplified persistence checking without XState
			const persistenceInterval = setInterval(async () => {
				try {
					const { sequenceContainer } = await import(
						'$lib/state/stores/sequence/SequenceContainer.svelte'
					);
					const { sequenceState } = await import('$lib/state/simple/sequenceState.svelte');
					untrack(() => {
						const isEmpty = sequenceContainer.state.beats.length === 0 && !hasStartPosition;
						sequenceState.setIsEmpty(isEmpty);
					});
				} catch (error) {
					console.warn('Error in persistence check:', error);
				}
			}, 10000); // Increased from 2000ms to 10000ms

			cleanupFunctions.push(() => {
				clearInterval(persistenceInterval);
			});

			// MIGRATED: Initialize persistence without XState
			try {
				await initializePersistenceNonEffects();
			} catch (error) {
				console.error('Error initializing persistence non-effects:', error);
			}

			isInitialized = true;
		} catch (error) {
			console.error('Error in EffectsInitializer:', error);
		}
	});

	onDestroy(() => {
		// Clean up all intervals and listeners
		cleanupFunctions.forEach((cleanup) => cleanup());
		cleanupFunctions = [];
	});

	// MIGRATED: Helper function to initialize persistence without XState
	async function initializePersistenceNonEffects() {
		if (typeof window === 'undefined') return;

		// Import the sequenceContainer
		const { sequenceContainer } = await import(
			'$lib/state/stores/sequence/SequenceContainer.svelte'
		);

		// First try to load from the modern 'sequence' storage
		let sequenceLoaded = false;
		try {
			sequenceLoaded = sequenceContainer.loadFromLocalStorage();
			if (sequenceLoaded) {
				// Handle successful load...
				console.log('Sequence loaded from localStorage');
			}
		} catch (error) {
			console.error('Error loading sequence from modern storage:', error);
		}

		// MIGRATED: Set up auto-save with pure Svelte 5 runes
		// The sequence state will handle its own persistence through effects
		console.log('Persistence initialized without XState subscriptions');
	}
</script>

<!-- This component doesn't render anything -->
