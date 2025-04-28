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
	<div class="generate-tab-header">
		<HeaderLabel />

		<!-- Generator type toggle -->
		<div class="generator-type">
			<GeneratorToggle
				options={generatorTypes}
				value={useNewStateManagement ? newGeneratorType : $activeGeneratorType}
				on:change={(e) => handleGeneratorTypeChange(e.detail)}
			/>
		</div>
	</div>

	<div class="generate-tab-content">
		<!-- Left panel: Generator content -->
		<div class="generator-panel">
			<div class="panel-content">
				{#if (useNewStateManagement ? newGeneratorType : $activeGeneratorType) === 'circular'}
					<CircularSequencer />
				{:else}
					<FreeformSequencer />
				{/if}
			</div>
		</div>

		<!-- Right panel: Controls -->
		<div class="controls-panel">
			<div class="panel-header">
				<h3>Sequence Parameters</h3>
				<div class="panel-description">
					Adjust these parameters to customize your generated sequence.
				</div>
			</div>

			<div class="controls-container">
				<div class="control-card" data-tooltip="Set the number of beats in your sequence">
					<LengthSelector />
				</div>

				<div class="control-card" data-tooltip="Control how dramatic the turns will be">
					<TurnIntensity />
				</div>

				<div class="control-card" data-tooltip="Choose between continuous or random prop movements">
					<PropContinuity />
				</div>

				<div class="control-card" data-tooltip="Set the complexity level of the generated sequence">
					<LevelSelector />
				</div>
			</div>

			<!-- Generate button -->
			<div class="generate-button-container">
				<GenerateButton
					isLoading={useNewStateManagement ? newIsGenerating : $isGenerating}
					hasError={useNewStateManagement ? newHasError : $hasError}
					statusMessage={useNewStateManagement ? newStatusMessage : $statusMessage}
					on:click={handleGenerate}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.generate-tab {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		padding: 1.5rem;
		gap: 1.5rem;
		background: var(--color-background, #121824);
		color: var(--color-text-primary, white);
		position: relative;
		overflow: hidden;
	}

	/* Add subtle background pattern */
	.generate-tab::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image:
			radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
		background-size: 40px 40px;
		background-position:
			0 0,
			20px 20px;
		pointer-events: none;
		z-index: 0;
	}

	.generate-tab-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		position: relative;
		z-index: 1;
	}

	.generator-type {
		display: flex;
		justify-content: center;
	}

	.generate-tab-content {
		display: flex;
		flex: 1;
		gap: 1.5rem;
		min-height: 0;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	.generator-panel,
	.controls-panel {
		display: flex;
		flex-direction: column;
		background: var(--color-surface-800, rgba(20, 30, 50, 0.5));
		border-radius: 0.75rem;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.2),
			0 0 0 1px rgba(255, 255, 255, 0.05);
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.generator-panel {
		flex: 3;
		min-width: 0;
	}

	.generator-panel:hover,
	.controls-panel:hover {
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	.controls-panel {
		flex: 2;
		max-width: 400px;
	}

	.panel-content {
		flex: 1;
		overflow: auto;
		padding: 1.5rem;
		scrollbar-width: thin;
		scrollbar-color: var(--color-accent, #3a7bd5) transparent;
	}

	.panel-content::-webkit-scrollbar {
		width: 6px;
	}

	.panel-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.panel-content::-webkit-scrollbar-thumb {
		background-color: var(--color-accent, #3a7bd5);
		border-radius: 3px;
	}

	.panel-header {
		padding: 1.5rem 1.5rem 0.75rem 1.5rem;
		position: relative;
	}

	.panel-header::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 1.5rem;
		width: 3rem;
		height: 3px;
		background: linear-gradient(to right, var(--color-accent, #3a7bd5), transparent);
		border-radius: 3px;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary, white);
		letter-spacing: -0.02em;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.panel-description {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
		line-height: 1.5;
		max-width: 90%;
	}

	.controls-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.75rem 1.5rem;
		overflow-y: auto;
	}

	.control-card {
		background: var(--color-surface-700, rgba(30, 40, 60, 0.7));
		border-radius: 0.5rem;
		padding: 1rem;
		transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
		border: 1px solid transparent;
		position: relative;
		overflow: hidden;
	}

	.control-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.control-card:hover {
		background: var(--color-surface-600, rgba(40, 50, 70, 0.7));
		transform: translateY(-2px) scale(1.02);
		box-shadow:
			0 8px 16px rgba(0, 0, 0, 0.2),
			0 0 0 1px rgba(58, 123, 213, 0.3);
		border-color: rgba(58, 123, 213, 0.2);
		z-index: 1;
	}

	.control-card:hover::before {
		opacity: 1;
	}

	.generate-button-container {
		padding: 1.5rem;
		background: var(--color-surface-900, rgba(15, 25, 40, 0.8));
		border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		display: flex;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.generate-button-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background: linear-gradient(to right, transparent, rgba(58, 123, 213, 0.5), transparent);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.generate-button-container:hover::before {
		opacity: 1;
	}

	/* Tooltips */
	.control-card {
		position: relative;
	}

	.control-card::after {
		content: attr(data-tooltip);
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(-8px) scale(0.95);
		padding: 0.5rem 0.75rem;
		background: var(--color-surface-900, rgba(15, 25, 40, 0.95));
		color: white;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		white-space: nowrap;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		opacity: 0;
		pointer-events: none;
		transition: all 0.2s ease;
		z-index: 10;
	}

	.control-card:hover::after {
		opacity: 1;
		transform: translateX(-50%) translateY(-4px) scale(1);
	}

	/* Focus states for accessibility */
	.control-card:focus-within {
		outline: none;
		box-shadow:
			0 0 0 2px var(--color-accent, #3a7bd5),
			0 4px 8px rgba(0, 0, 0, 0.2);
	}

	/* Responsive adjustments */
	@media (max-width: 1024px) {
		.generate-tab-content {
			flex-direction: column;
		}

		.controls-panel {
			max-width: none;
		}

		.generator-panel,
		.controls-panel {
			transition:
				transform 0.3s ease,
				box-shadow 0.3s ease;
		}

		.generator-panel:hover,
		.controls-panel:hover {
			transform: translateY(-4px);
		}
	}

	@media (max-width: 768px) {
		.generate-tab {
			padding: 1rem;
		}

		.generate-tab-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.generator-type {
			width: 100%;
			justify-content: flex-start;
		}

		.panel-content,
		.controls-container,
		.generate-button-container {
			padding: 1rem;
		}

		.panel-header {
			padding: 1rem 1rem 0.5rem 1rem;
		}

		.control-card::after {
			white-space: normal;
			width: 200px;
			text-align: center;
		}
	}

	/* Touch device optimizations */
	@media (hover: none) {
		.control-card:active {
			background: var(--color-surface-600, rgba(40, 50, 70, 0.7));
		}

		.control-card::after {
			display: none;
		}
	}

	/* Animation for panel transitions */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
			filter: blur(5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
			filter: blur(0);
		}
	}

	@keyframes slideIn {
		from {
			transform: translateX(20px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.generator-panel,
	.controls-panel {
		animation: fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
	}

	.generator-panel {
		animation-delay: 0.1s;
	}

	.controls-panel {
		animation-delay: 0.2s;
	}

	.control-card {
		animation: slideIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
		opacity: 0;
	}

	.control-card:nth-child(1) {
		animation-delay: 0.3s;
	}
	.control-card:nth-child(2) {
		animation-delay: 0.4s;
	}
	.control-card:nth-child(3) {
		animation-delay: 0.5s;
	}
	.control-card:nth-child(4) {
		animation-delay: 0.6s;
	}

	/* Subtle background animation */
	@keyframes gradientShift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.generate-button-container {
		background: linear-gradient(
			135deg,
			var(--color-surface-900, rgba(15, 25, 40, 0.8)),
			var(--color-surface-800, rgba(20, 30, 50, 0.8)),
			var(--color-surface-900, rgba(15, 25, 40, 0.8))
		);
		background-size: 200% 200%;
		animation: gradientShift 15s ease infinite;
	}
</style>
