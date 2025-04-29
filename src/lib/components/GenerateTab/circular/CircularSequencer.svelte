<!-- src/lib/components/GenerateTab/circular/CircularSequencer.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';

	// Import both old and new state management to allow for gradual migration
	// Old state management (will be removed after migration)
	import {
		settingsStore,
		capType,
		numBeats,
		turnIntensity,
		propContinuity
	} from '../store/settings';
	import { generatorStore } from '../store/generator';
	import { beatsStore } from '../../../stores/sequence/beatsStore';

	// New state management (XState and centralized stores)
	import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';
	import { settingsStore as newSettingsStore, type CAPType } from '$lib/state/stores/settingsStore';

	import CAPPicker from './CAPPicker/CAPPicker.svelte';
	import { createCircularSequence } from './createCircularSequence';

	// CAP types data with descriptions
	const capTypes = [
		{
			id: 'mirrored',
			label: 'Mirrored',
			description: 'Creates a mirrored sequence where the second half mirrors the first half.'
		},
		{
			id: 'rotated',
			label: 'Rotated',
			description:
				'Creates a rotated sequence where the second half repeats the first half with rotation.'
		},
		{
			id: 'mirrored_complementary',
			label: 'Mirrored Complementary',
			description: 'Creates a mirrored sequence with complementary motion types.'
		},
		{
			id: 'rotated_complementary',
			label: 'Rotated Complementary',
			description: 'Creates a rotated sequence with complementary motion types.'
		},
		{
			id: 'mirrored_swapped',
			label: 'Mirrored Swapped',
			description: 'Creates a mirrored sequence with swapped prop colors.'
		},
		{
			id: 'rotated_swapped',
			label: 'Rotated Swapped',
			description: 'Creates a rotated sequence with swapped prop colors.'
		},
		{
			id: 'strict_mirrored',
			label: 'Strict Mirrored',
			description: 'Creates a strictly mirrored sequence with exact mirror positions.'
		},
		{
			id: 'strict_rotated',
			label: 'Strict Rotated',
			description: 'Creates a strictly rotated sequence with exact rotation positions.'
		},
		{
			id: 'strict_complementary',
			label: 'Strict Complementary',
			description: 'Creates a sequence with strictly complementary motion types.'
		},
		{
			id: 'strict_swapped',
			label: 'Strict Swapped',
			description: 'Creates a sequence with strictly swapped prop colors.'
		},
		{
			id: 'swapped_complementary',
			label: 'Swapped Complementary',
			description: 'Creates a sequence with swapped colors and complementary motion types.'
		}
	];

	// Local state
	let currentCapType = $capType;
	let selectedCapInfo = capTypes.find((cap) => cap.id === currentCapType) || capTypes[0];

	// Update the selected CAP info when the store changes
	$: {
		currentCapType = $capType;
		selectedCapInfo = capTypes.find((cap) => cap.id === currentCapType) || capTypes[0];
	}

	// Get state from sequence machine
	$: isGenerating = sequenceSelectors.isGenerating();
	$: generationProgress = sequenceSelectors.progress();
	$: generationMessage = sequenceSelectors.message();

	// Flag to determine which state management to use
	$: useNewStateManagement = true; // Set to true to use the new state management

	// Handle CAP type selection
	function handleCapTypeSelect(newCapType: string) {
		// Current implementation (using old store)
		settingsStore.setCAPType(newCapType as any);

		// New implementation (using new store)
		if (useNewStateManagement) {
			newSettingsStore.setCAPType(newCapType as CAPType);
		}
	}

	// Handle generate sequence
	async function handleGenerateSequence() {
		if (useNewStateManagement) {
			// New implementation using sequence machine
			// Get current settings
			const settings = {
				capType: $capType,
				numBeats: $numBeats,
				turnIntensity: $turnIntensity,
				propContinuity: $propContinuity
			};

			// Use the sequence machine to generate the sequence
			sequenceActions.generate(settings, 'circular');
		} else {
			// Current implementation (using old stores)
			generatorStore.startGeneration();

			try {
				// Create the sequence
				const result = await createCircularSequence({
					capType: $capType,
					numBeats: $numBeats,
					turnIntensity: $turnIntensity,
					propContinuity: $propContinuity
				});

				// Update the beats store with the new sequence
				beatsStore.set(result);

				// Complete the generation
				generatorStore.completeGeneration();
			} catch (error: unknown) {
				// Handle error
				const errorMessage = error instanceof Error ? error.message : 'Failed to generate sequence';
				generatorStore.setError(errorMessage);
				console.error('Generate sequence error:', error);
			}
		}
	}

	// Listen for generate-sequence event
	function setupEventListener() {
		const handleEvent = () => {
			handleGenerateSequence();
		};

		document.addEventListener('generate-sequence', handleEvent as EventListener);

		return () => {
			document.removeEventListener('generate-sequence', handleEvent as EventListener);
		};
	}

	// Lifecycle
	onMount(() => {
		const cleanup = setupEventListener();
		return cleanup;
	});
</script>

<div class="circular-sequencer">
	<h3>Circular Sequence Generator</h3>

	<div class="content">
		<div class="cap-picker-container">
			<CAPPicker
				{capTypes}
				selectedCapId={currentCapType}
				on:select={(e) => handleCapTypeSelect(e.detail)}
			/>
		</div>

	</div>
</div>

<style>
	.circular-sequencer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	h3 {
		font-size: 1.25rem;
		color: var(--color-text-primary, white);
		margin: 0;
		font-weight: 500;
	}

	.content {
		display: flex;
		gap: 1.5rem;
		width: 100%;
	}

	.cap-picker-container {
		flex: 2;
		overflow-y: auto;
		max-height: 30rem;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.content {
			flex-direction: column;
		}

		.cap-picker-container {
			width: 100%;
		}

		.cap-picker-container {
			max-height: 20rem;
		}
	}
</style>
