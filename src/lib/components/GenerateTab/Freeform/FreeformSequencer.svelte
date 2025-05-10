<script lang="ts">
	/* ───────────────────────────────
	   Imports
	──────────────────────────────── */
	import { onMount } from 'svelte';

	// legacy stores
	import { settingsStore, numBeats, turnIntensity, propContinuity } from '../store/settings';
	import { generatorStore } from '../store/generator';
	// Use beatsStore for compatibility with legacy BeatData type
	import { beatsStore } from '$lib/stores/sequence/beatsStore';

	// shared types / enums
	import { Letter } from '$lib/types/Letter';
	import type { VTGTiming, VTGDir, GridMode } from '$lib/types/Types';
	import { PropType } from '$lib/types/Types';
	import type { BeatData } from '$lib/components/SequenceWorkbench/SequenceBeatFrame/BeatData';

	// XState & new stores
	import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';
	import { settingsStore as newSettingsStore } from '$lib/state/stores/settingsStore';

	// UI helpers
	import LetterTypePicker from './LetterTypePicker/LetterTypePicker.svelte';
	import { createFreeformSequence } from './createFreeformSequence';

	/* ───────────────────────────────
	   Reactive local state
	──────────────────────────────── */
	$: useNewStateManagement = true; // flip when migration finishes
	$: isGenerating = sequenceSelectors.isGenerating();
	$: generationProgress = sequenceSelectors.progress();
	$: generationMessage = sequenceSelectors.message();

	const letterTypeOptions = [
		{ id: 'type1', label: 'Type 1', description: 'Basic motions with minimal complexity' },
		{ id: 'type2', label: 'Type 2', description: 'Intermediate flow with moderate transitions' },
		{ id: 'type3', label: 'Type 3', description: 'Advanced patterns with complex movements' },
		{ id: 'type4', label: 'Type 4', description: 'Expert-level intricate sequences' }
	];

	let selectedLetterTypes: string[] = [];
	function handleLetterTypeSelect(types: string[]) {
		selectedLetterTypes = types;
	}

	/* ───────────────────────────────
	   Generate-sequence handler
	──────────────────────────────── */
	async function handleGenerateSequence() {
		if (useNewStateManagement) {
			// Call the generate action with the correct parameters
			sequenceActions.generate(
				{
					numBeats: $numBeats,
					turnIntensity: $turnIntensity,
					propContinuity: $propContinuity,
					letterTypes: selectedLetterTypes
				} as any,
				'freeform'
			);
			return;
		}

		/* ── legacy branch ───────────────── */
		generatorStore.startGeneration();
		try {
			const result = await createFreeformSequence({
				numBeats: $numBeats,
				turnIntensity: $turnIntensity,
				propContinuity: $propContinuity,
				letterTypes: selectedLetterTypes,
				capType: $settingsStore.capType
			});

			const workbenchBeats: BeatData[] = result.map((beat, index) => {
				const letterValue: Letter | null =
					beat.letterType === 'type1'
						? Letter.A
						: beat.letterType === 'type2'
							? Letter.B
							: beat.letterType === 'type3'
								? Letter.C
								: beat.letterType === 'type4'
									? Letter.D
									: null;

				return {
					beatNumber: index + 1,
					filled: true,
					pictographData: {
						/* grid / structure */
						gridMode: 'diamond' as GridMode,
						grid: 'diamond',
						gridData: null,

						/* TKA */
						letter: letterValue,
						startPos: null,
						endPos: null,

						/* VTG */
						timing: 'together' as VTGTiming,
						direction: 'same' as VTGDir,

						/* hand motions (placeholder) */
						blueMotionData: null,
						redMotionData: null,

						/* props */
						redPropData: null,
						bluePropData: null,

						/* arrows */
						redArrowData: null,
						blueArrowData: null
					}
				} satisfies BeatData;
			});

			// Use the beatsStore for compatibility with legacy BeatData type
			beatsStore.set(workbenchBeats);
			generatorStore.completeGeneration();
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to generate freeform sequence';
			generatorStore.setError(msg);
			console.error('Generate freeform sequence error:', err);
		}
	}

	/* ───────────────────────────────
	   DOM event wiring
	──────────────────────────────── */
	function setupEventListener() {
		const handleEvent = () => handleGenerateSequence();
		document.addEventListener('generate-sequence', handleEvent as EventListener);
		return () => document.removeEventListener('generate-sequence', handleEvent as EventListener);
	}

	onMount(() => setupEventListener());
</script>

<div class="freeform-sequencer">
	<h3>Freeform Sequence Generator</h3>

	<div class="content">
		<div class="letter-type-picker-container">
			<LetterTypePicker
				options={letterTypeOptions}
				on:select={(e: CustomEvent<{ detail: string[] }>) =>
					handleLetterTypeSelect(e.detail.detail)}
			/>
		</div>

		<div class="description-container">
			<div class="description-card">
				<h4>Freeform Sequence</h4>

				<div class="info-box">
					<div class="info-item">
						<span class="info-label">Length:</span>
						<span class="info-value">{$numBeats} beats</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.freeform-sequencer {
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
	.letter-type-picker-container {
		flex: 2;
		overflow-y: auto;
		max-height: 30rem;
	}
	.description-container {
		flex: 1;
		min-width: 240px;
	}

	.description-card {
		background: var(--color-surface, rgba(30, 40, 60, 0.85));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.description-card h4 {
		font-size: 1.1rem;
		margin: 0 0 0.75rem;
		color: var(--color-text-primary, white);
		font-weight: 500;
	}

	.info-box {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: var(--color-surface-hover, rgba(255, 255, 255, 0.05));
		border-radius: 0.375rem;
	}
	.info-item {
		display: flex;
		justify-content: space-between;
	}
	.info-label {
		font-size: 0.8rem;
		color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
	}
	.info-value {
		font-size: 0.8rem;
		color: var(--color-accent, #3a7bd5);
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.content {
			flex-direction: column;
		}
		.letter-type-picker-container,
		.description-container {
			width: 100%;
		}
		.letter-type-picker-container {
			max-height: 20rem;
		}
	}
</style>
