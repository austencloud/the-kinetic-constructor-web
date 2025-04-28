<!-- src/lib/components/GenerateTab/GenerateTab.svelte -->
<script lang="ts">
	// Import state management
	import { onMount } from 'svelte';
	import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';
	import { settingsStore as newSettingsStore } from '$lib/state/stores/settingsStore';

	// Import existing stores for backward compatibility during migration
	import {
		settingsStore,
		generatorType as activeGeneratorType,
		numBeats,
		turnIntensity,
		propContinuity,
		capType,
		level
	} from './store/settings';
	import { isGenerating, hasError, statusMessage } from './store/generator';

	// Import UI components
	import GenerateButton from './ui/GenerateButton.svelte';
	import HeaderLabel from './ui/HeaderLabel.svelte';
	import GeneratorToggle from './ui/GeneratorToggle.svelte';
	import LengthSelector from './ui/LengthSelector.svelte';
	import TurnIntensity from './ui/TurnIntensity.svelte';
	import PropContinuity from './ui/PropContinuity.svelte';
	import LevelSelector from './ui/LevelSelector/LevelSelector.svelte';

	// Import generators
	import CircularSequencer from './circular/CircularSequencer.svelte';
	import FreeformSequencer from './Freeform/FreeformSequencer.svelte';

	// Generator types for the toggle
	const generatorTypes = [
		{ id: 'circular', label: 'Circular' },
		{ id: 'freeform', label: 'Freeform' }
	];

	// Get state from sequence machine
	// These will replace the existing store variables when we fully migrate
	$: newIsGenerating = sequenceSelectors.isGenerating();
	$: newHasError = sequenceSelectors.hasError();
	$: newStatusMessage = sequenceSelectors.message();
	$: newGeneratorType = sequenceSelectors.generationType();

	// Use both old and new state management during migration
	// We'll gradually switch from old to new as components are migrated
	$: useNewStateManagement = true; // Set to true to use the new state management

	// Handle generate click
	function handleGenerate() {
		if (useNewStateManagement) {
			// New implementation using sequence machine
			// Get current settings from the store values
			const settings = {
				numBeats: $numBeats,
				turnIntensity: $turnIntensity,
				propContinuity: $propContinuity,
				capType: $capType,
				level: $level
			};

			// Use the sequence machine to generate the sequence
			sequenceActions.generate(settings, $activeGeneratorType);
		} else {
			// Current implementation using event dispatch
			const event = new CustomEvent('generate-sequence', {
				detail: {
					// We could pass additional options here if needed
				}
			});

			document.dispatchEvent(event);
		}
	}

	// Handle generator type change
	function handleGeneratorTypeChange(type: string) {
		// Current implementation
		settingsStore.setGeneratorType(type as 'circular' | 'freeform');

		// New implementation
		if (useNewStateManagement) {
			newSettingsStore.setGeneratorType(type as 'circular' | 'freeform');
		}
	}

	// Initialization logic
	onMount(() => {
		if (useNewStateManagement) {
			// Initialize the sequence machine with the current settings
			console.log('Initializing sequence machine with current settings');

			// Sync the old settings to the new settings store
			newSettingsStore.setGeneratorType($activeGeneratorType);
			newSettingsStore.setNumBeats($numBeats);
			newSettingsStore.setTurnIntensity($turnIntensity);
			newSettingsStore.setPropContinuity($propContinuity);
			newSettingsStore.setCAPType($capType);
			newSettingsStore.setLevel($level);
		}
	});
</script>

<div class="generate-tab">
	<HeaderLabel />

	<!-- Generator type toggle -->
	<div class="generator-type">
		<GeneratorToggle
			options={generatorTypes}
			value={useNewStateManagement ? newGeneratorType : $activeGeneratorType}
			on:change={(e) => handleGeneratorTypeChange(e.detail)}
		/>
	</div>

	<!-- Generator content - shows either circular or freeform -->
	<div class="generator-content">
		{#if (useNewStateManagement ? newGeneratorType : $activeGeneratorType) === 'circular'}
			<CircularSequencer />
		{:else}
			<FreeformSequencer />
		{/if}
	</div>

	<!-- Generator controls -->
	<div class="controls-container">
		<div class="controls-grid">
			<LengthSelector />
			<TurnIntensity />
			<PropContinuity />
			<LevelSelector />
		</div>

		<!-- Generate button -->
		<div class="generate-button">
			<GenerateButton
				isLoading={useNewStateManagement ? newIsGenerating : $isGenerating}
				hasError={useNewStateManagement ? newHasError : $hasError}
				statusMessage={useNewStateManagement ? newStatusMessage : $statusMessage}
				on:click={handleGenerate}
			/>
		</div>
	</div>
</div>

<style>
	.generate-tab {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		padding: 1rem;
		gap: 1.5rem;
	}

	.generator-type {
		display: flex;
		justify-content: center;
		margin-bottom: 0.5rem;
	}

	.generator-content {
		flex: 1;
		min-height: 0;
		display: flex;
		overflow: auto;
	}

	.controls-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.controls-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
	}

	.generate-button {
		display: flex;
		justify-content: center;
		margin-top: 0.5rem;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.controls-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
