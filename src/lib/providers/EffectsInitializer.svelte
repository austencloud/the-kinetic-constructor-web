<!-- src/lib/providers/EffectsInitializer.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	/**
	 * This component initializes all the effects that need to run in a proper Svelte component context.
	 * It's used by ServiceProvider to ensure $effect runes are used correctly.
	 */

	let isInitialized = $state(false);

	onMount(async () => {
		if (!browser || isInitialized) return;

		try {
			// Initialize sequence auto-save
			const { sequenceContainer } = await import('$lib/state/stores/sequence/SequenceContainer.svelte');
			
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
						sequenceContainer.saveToLocalStorage();
						lastSavedState = currentState;
					}

					saveTimeoutId = null;
				}, 0);
			};

			// Auto-save effect
			$effect(() => {
				if (sequenceContainer.state.isModified) {
					debouncedSave();
				}
			});

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

			// Initialize theme functionality
			const { getCurrentTheme, getActiveTheme, themeService } = await import('$lib/styles/themeService.svelte');
			
			// Theme effect
			$effect(() => {
				// Watch for theme changes and apply automatically
				getActiveTheme();
				themeService.applyTheme();
			});

			// Initialize sequence persistence
			const { initializePersistence, sequenceActor } = await import('$lib/state/machines/sequenceMachine');
			
			// Set up sequence watching effect
			let hasStartPosition = false;
			try {
				const { getSelectedStartPos } = await import('$lib/state/machines/sequenceMachine/persistence.svelte');
				const currentStartPos = getSelectedStartPos();
				hasStartPosition = !!currentStartPos;
			} catch (error) {
				console.warn('Error getting start position:', error);
				hasStartPosition = false;
			}

			// Sequence persistence effect
			$effect(() => {
				import('$lib/state/stores/sequence/SequenceContainer.svelte').then(({ sequenceContainer }) => {
					const { setIsSequenceEmpty } = import('$lib/state/machines/sequenceMachine/persistence.svelte');
					setIsSequenceEmpty.then((fn) => {
						const isEmpty = sequenceContainer.state.beats.length === 0 && !hasStartPosition;
						fn.setIsSequenceEmpty(isEmpty);
					});
				});
			});

			// Initialize the rest of persistence (non-effect parts)
			try {
				// Call the non-effect parts of initializePersistence
				await initializePersistenceNonEffects(sequenceActor);
			} catch (error) {
				console.error('Error initializing persistence non-effects:', error);
			}

			isInitialized = true;
		} catch (error) {
			console.error('Error in EffectsInitializer:', error);
		}
	});

	// Helper function to initialize non-effect parts of persistence
	async function initializePersistenceNonEffects(sequenceActor: any) {
		if (typeof window === 'undefined') return;

		// Import the sequenceContainer
		const { sequenceContainer } = await import('$lib/state/stores/sequence/SequenceContainer.svelte');
		
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

		// Subscribe to state changes to save backup with debouncing
		let saveTimeout: ReturnType<typeof setTimeout> | null = null;

		sequenceActor.subscribe((state: any) => {
			// Clear existing timeout to debounce saves
			if (saveTimeout) {
				clearTimeout(saveTimeout);
			}

			// Use longer timeout to break reactivity chains and debounce saves
			saveTimeout = setTimeout(() => {
				// Save logic here...
				try {
					sequenceContainer.saveToLocalStorage();
				} catch (error) {
					console.error('Error saving sequence:', error);
				}
			}, 500);
		});
	}
</script>

<!-- This component doesn't render anything -->
