<!--
  Data-Driven BeatGrid Test Component
  Uses authentic pictograph data from CSV dataframe
  Eliminates manually crafted mock data for realistic testing
-->
<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import ModernBeatGrid from './ModernBeatGrid.svelte';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import type { IWorkbenchService } from '$lib/services/core/IWorkbenchService';
	import {
		getRandomPictographData,
		getPictographDataByLetter,
		getValidPictographSequence,
		getAllValidLetters,
		pictographDataLoader,
		type PictographDataLoaderOptions
	} from '$lib/utils/testing/PictographDataLoader';
	import { PictographDataValidator } from '$lib/utils/testing/PictographDataValidator';
	import type { PictographData } from '$lib/types/PictographData';
	import type { BeatData } from '../BeatData';

	// Data-driven test state
	let testBeats = $state<BeatData[]>([]);
	let availableLetters = $state<string[]>([]);
	let testStartPosition = $state<PictographData | null>(null);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);
	let dataStatistics = $state<any>(null);
	let validationResults = $state<any[]>([]);

	// Test configuration
	let testOptions = $state<PictographDataLoaderOptions>({
		includeStaticMotions: true,
		includeDashMotions: true,
		filterByTiming: undefined,
		filterByDirection: undefined
	});

	// Test scenario selection
	let currentScenario = $state<'random' | 'letter' | 'sequence' | 'edge-cases'>('random');
	let selectedLetter = $state<string>('A');
	let sequenceLength = $state<number>(3);

	// Mock service implementations with reactive data
	const mockSequenceService: ISequenceService = {
		get state() {
			return {
				beats: testBeats,
				selectedBeatIds: testBeats.length > 0 ? [testBeats[0].id] : [],
				currentBeatIndex: 0,
				startPosition: testStartPosition,
				metadata: {
					name: 'Data-Driven Test Sequence',
					difficulty: 1,
					tags: ['test', 'data-driven', 'csv-authentic'],
					description: `Test sequence using authentic CSV pictograph data (${currentScenario} scenario)`,
					author: 'PictographDataLoader',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				isModified: false,
				isPlaying: false,
				playbackPosition: 0
			};
		},
		selectedBeats: [],
		get isEmpty() {
			return testBeats.length === 0;
		},
		currentBeat: null,
		get beatCount() {
			return testBeats.length;
		},
		get hasSelection() {
			return testBeats.length > 0;
		},
		addBeat: () => {},
		addBeats: () => {},
		removeBeat: () => {},
		updateBeat: () => {},
		clearSequence: () => {},
		setStartPosition: () => {},
		selectBeat: (beatId: string) => {
			console.log('DataDriven: selectBeat called with', beatId);
		},
		deselectBeat: () => {},
		clearSelection: () => {},
		selectAll: () => {},
		setCurrentBeatIndex: () => {},
		nextBeat: () => {},
		previousBeat: () => {},
		updateMetadata: () => {},
		markAsSaved: () => {},
		markAsModified: () => {},
		play: () => {},
		pause: () => {},
		stop: () => {},
		setPlaybackPosition: () => {},
		saveToLocalStorage: () => {},
		loadFromLocalStorage: () => false,
		exportState: () => mockSequenceService.state,
		importState: () => {},
		on: () => () => {} // Mock event listener that returns unsubscribe function
	};

	const mockWorkbenchService: IWorkbenchService = {
		state: {
			activePanel: 'generate',
			toolsPanelOpen: false,
			fullscreenMode: false,
			viewMode: 'normal',
			layout: {
				containerWidth: 800,
				containerHeight: 600,
				beatGridColumns: 4,
				beatGridRows: 1,
				cellSize: 120,
				isPortrait: false,
				layoutMode: 'desktop'
			},
			isLoading: false,
			error: null
		},
		isMobile: false,
		isTablet: false,
		isDesktop: true,
		canShowToolsPanel: true,
		optimalCellSize: () => 120,
		setActivePanel: (panel) => {
			console.log('DataDriven: setActivePanel called with', panel);
		},
		toggleToolsPanel: () => {},
		openToolsPanel: () => {},
		closeToolsPanel: () => {},
		updateLayout: () => {},
		setViewMode: () => {},
		toggleFullscreen: () => {},
		enterFullscreen: () => {},
		exitFullscreen: () => {},
		handleResize: () => {},
		calculateOptimalLayout: () => mockWorkbenchService.state.layout,
		setLoading: () => {},
		setError: () => {},
		clearError: () => {},
		saveLayoutPreferences: () => {},
		loadLayoutPreferences: () => {}
	};

	// Provide services to child components
	setContext<ISequenceService>('sequenceService', mockSequenceService);
	setContext<IWorkbenchService>('workbenchService', mockWorkbenchService);

	// Container dimensions
	let containerWidth = $state(800);
	let containerHeight = $state(600);

	// Initialize data loader and load initial test data
	onMount(async () => {
		try {
			isLoading = true;
			loadError = null;

			// Load CSV data
			await pictographDataLoader.loadData();

			// Get available letters
			availableLetters = await getAllValidLetters();

			// Get data statistics
			dataStatistics = await pictographDataLoader.getDataStatistics();

			// Load initial test scenario
			await loadTestScenario();

			console.log('DataDrivenBeatGridTest: Initialized with', {
				availableLetters: availableLetters.length,
				totalEntries: dataStatistics.totalEntries,
				testBeats: testBeats.length
			});
		} catch (error) {
			console.error('DataDrivenBeatGridTest: Failed to initialize:', error);
			loadError = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			isLoading = false;
		}
	});

	// Convert PictographData to BeatData
	function createBeatData(pictographData: PictographData, index: number): BeatData {
		return {
			id: `beat-${index + 1}`,
			beatNumber: index + 1,
			filled: true,
			pictographData,
			duration: 1,
			metadata: {
				blueReversal: false,
				redReversal: false,
				tags: ['csv-authentic', currentScenario]
			}
		};
	}

	// Load test scenario based on current selection
	async function loadTestScenario() {
		try {
			validationResults = [];

			switch (currentScenario) {
				case 'random':
					await loadRandomBeats();
					break;
				case 'letter':
					await loadLetterBeats();
					break;
				case 'sequence':
					await loadSequenceBeats();
					break;
				case 'edge-cases':
					await loadEdgeCaseBeats();
					break;
			}

			// Validate all loaded data
			testBeats.forEach((beat, index) => {
				if (beat.pictographData) {
					const validation = PictographDataValidator.validatePictographData(beat.pictographData, {
						strictMode: true,
						checkBusinessRules: true
					});
					validationResults.push({ beatIndex: index, ...validation });
				}
			});

			console.log('DataDrivenBeatGridTest: Loaded scenario', {
				scenario: currentScenario,
				beatCount: testBeats.length,
				validationErrors: validationResults.filter((r) => !r.isValid).length
			});
		} catch (error) {
			console.error('Failed to load test scenario:', error);
			loadError = error instanceof Error ? error.message : 'Failed to load scenario';
		}
	}

	// Load random beats
	async function loadRandomBeats() {
		const pictographs = await Promise.all([
			getRandomPictographData(testOptions),
			getRandomPictographData(testOptions),
			getRandomPictographData(testOptions)
		]);

		testBeats = pictographs.map((p, i) => createBeatData(p, i));

		// Set random start position
		testStartPosition = await getRandomPictographData(testOptions);
	}

	// Load beats for specific letter
	async function loadLetterBeats() {
		const pictographs = await getPictographDataByLetter(selectedLetter, testOptions);

		// Take first 3 or all if less than 3
		const selectedPictographs = pictographs.slice(0, Math.min(3, pictographs.length));
		testBeats = selectedPictographs.map((p, i) => createBeatData(p, i));

		// Set start position from same letter
		testStartPosition = pictographs.length > 3 ? pictographs[3] : pictographs[0];
	}

	// Load connected sequence
	async function loadSequenceBeats() {
		const sequence = await getValidPictographSequence(sequenceLength, testOptions);
		testBeats = sequence.map((p, i) => createBeatData(p, i));

		// Set start position that connects to first beat
		if (sequence.length > 0) {
			const connectingPictographs = await pictographDataLoader.getRawEntries();
			const connecting = connectingPictographs.find(
				(entry) => entry.endPos === sequence[0].startPos
			);

			if (connecting) {
				testStartPosition = await getRandomPictographData(testOptions);
			} else {
				testStartPosition = sequence[0];
			}
		}
	}

	// Load edge case scenarios
	async function loadEdgeCaseBeats() {
		const edgeCases = await Promise.all([
			// Static motions only
			getRandomPictographData({ ...testOptions, includeDashMotions: false }),
			// Dash motions only
			getRandomPictographData({ ...testOptions, includeStaticMotions: false }),
			// Quarter timing only
			getRandomPictographData({ ...testOptions, filterByTiming: ['quarter'] })
		]);

		testBeats = edgeCases.map((p, i) => createBeatData(p, i));
		testStartPosition = await getRandomPictographData({ ...testOptions, filterByTiming: ['none'] });
	}

	// Event handlers
	function handleBeatClick(beatId: string) {
		console.log('DataDriven: Beat clicked:', beatId);
	}

	function handleBeatDoubleClick(beatId: string) {
		console.log('DataDriven: Beat double-clicked:', beatId);
	}

	function handleStartPosClick() {
		console.log('DataDriven: Start position clicked');
	}

	// Test controls
	async function refreshScenario() {
		await loadTestScenario();
	}

	async function addRandomBeat() {
		try {
			const newPictograph = await getRandomPictographData(testOptions);
			const newBeat = createBeatData(newPictograph, testBeats.length);
			testBeats = [...testBeats, newBeat];

			console.log('DataDriven: Added random beat', newBeat.id);
		} catch (error) {
			console.error('Failed to add random beat:', error);
		}
	}

	function clearBeats() {
		testBeats = [];
		console.log('DataDriven: Cleared all beats');
	}

	function toggleFullscreen() {
		mockWorkbenchService.state.fullscreenMode = !mockWorkbenchService.state.fullscreenMode;
		console.log('DataDriven: Fullscreen toggled:', mockWorkbenchService.state.fullscreenMode);
	}

	// Reactive scenario change
	$effect(() => {
		if (!isLoading && availableLetters.length > 0) {
			loadTestScenario();
		}
	});
</script>

<div class="data-driven-test-container">
	<div class="test-header">
		<h2>🧪 Data-Driven BeatGrid Test</h2>
		<div class="test-status">
			{#if isLoading}
				<span class="status loading">⏳ Loading CSV data...</span>
			{:else if loadError}
				<span class="status error">❌ Error: {loadError}</span>
			{:else}
				<span class="status success">✅ CSV Loaded: {dataStatistics?.totalEntries} entries</span>
			{/if}
		</div>
	</div>

	{#if !isLoading && !loadError}
		<div class="test-controls">
			<div class="scenario-controls">
				<label>Test Scenario:</label>
				<select bind:value={currentScenario}>
					<option value="random">Random Pictographs</option>
					<option value="letter">Specific Letter</option>
					<option value="sequence">Connected Sequence</option>
					<option value="edge-cases">Edge Cases</option>
				</select>

				{#if currentScenario === 'letter'}
					<select bind:value={selectedLetter}>
						{#each availableLetters as letter}
							<option value={letter}>{letter}</option>
						{/each}
					</select>
				{/if}

				{#if currentScenario === 'sequence'}
					<input type="number" bind:value={sequenceLength} min="1" max="10" placeholder="Length" />
				{/if}

				<button onclick={refreshScenario}>🔄 Refresh</button>
			</div>

			<div class="data-controls">
				<label>
					<input type="checkbox" bind:checked={testOptions.includeStaticMotions} /> Static Motions
				</label>
				<label>
					<input type="checkbox" bind:checked={testOptions.includeDashMotions} /> Dash Motions
				</label>
				<button onclick={addRandomBeat}>➕ Add Random</button>
				<button onclick={clearBeats}>🗑️ Clear</button>
				<button onclick={toggleFullscreen}>⛶ Fullscreen</button>
			</div>

			<div class="test-info">
				<span>Beats: {testBeats.length}</span>
				<span>Letters: {availableLetters.length}</span>
				<span
					>Validation: {validationResults.filter((r) => r.isValid)
						.length}/{validationResults.length} ✓</span
				>
				<span>Size: {containerWidth}×{containerHeight}</span>
			</div>
		</div>

		<div
			class="test-grid-container"
			style="width: {containerWidth}px; height: {containerHeight}px;"
		>
			<ModernBeatGrid
				{containerWidth}
				{containerHeight}
				isScrollable={false}
				fullScreenMode={mockWorkbenchService.state.fullscreenMode}
				onBeatClick={handleBeatClick}
				onBeatDoubleClick={handleBeatDoubleClick}
				onStartPosClick={handleStartPosClick}
			/>
		</div>

		<div class="test-validation">
			<h3>🔍 Data Validation Results</h3>
			{#if validationResults.length > 0}
				<div class="validation-summary">
					<span class="valid">✅ Valid: {validationResults.filter((r) => r.isValid).length}</span>
					<span class="invalid"
						>❌ Invalid: {validationResults.filter((r) => !r.isValid).length}</span
					>
					<span class="warnings"
						>⚠️ Warnings: {validationResults.reduce((sum, r) => sum + r.warnings.length, 0)}</span
					>
				</div>

				{#each validationResults as result, index}
					{#if !result.isValid || result.warnings.length > 0}
						<div class="validation-item" class:invalid={!result.isValid}>
							<strong>Beat {result.beatIndex + 1}:</strong>
							{#if result.errors.length > 0}
								<ul class="errors">
									{#each result.errors as error}
										<li>❌ {error}</li>
									{/each}
								</ul>
							{/if}
							{#if result.warnings.length > 0}
								<ul class="warnings">
									{#each result.warnings as warning}
										<li>⚠️ {warning}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}
				{/each}
			{:else}
				<p class="no-validation">No beats to validate</p>
			{/if}
		</div>

		<div class="test-statistics">
			<h3>📊 CSV Data Statistics</h3>
			{#if dataStatistics}
				<div class="stats-grid">
					<div class="stat-item">
						<span class="stat-label">Total Entries:</span>
						<span class="stat-value">{dataStatistics.totalEntries}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Unique Letters:</span>
						<span class="stat-value">{dataStatistics.uniqueLetters}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Motion Types:</span>
						<span class="stat-value">
							{Object.entries(dataStatistics.motionTypes)
								.map(([type, count]) => `${type}: ${count}`)
								.join(', ')}
						</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<div class="test-footer">
		<p>
			🎯 <strong>Data-Driven Testing:</strong> All pictograph data sourced from authentic CSV dataframe
		</p>
		<p>🚫 <strong>Zero Manual Mocks:</strong> No manually crafted pictograph data used</p>
		<p>✅ <strong>Real-World Validation:</strong> Tests use only valid pictograph combinations</p>
		<p>
			⚡ <strong>Phase 2 Architecture:</strong> Modern Svelte 5 components with service injection
		</p>
	</div>

	<style>
		.data-driven-test-container {
			padding: 20px;
			max-width: 1400px;
			margin: 0 auto;
			font-family: system-ui, sans-serif;
			background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
			border-radius: 12px;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		}

		.test-header {
			margin-bottom: 20px;
			padding: 20px;
			background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
			border-radius: 8px;
			color: white;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.test-header h2 {
			margin: 0;
			font-size: 1.5rem;
			font-weight: 600;
		}

		.test-status .status {
			padding: 6px 12px;
			border-radius: 6px;
			font-weight: 500;
			font-size: 0.9rem;
		}

		.status.loading {
			background: rgba(251, 191, 36, 0.2);
			color: #f59e0b;
		}

		.status.error {
			background: rgba(239, 68, 68, 0.2);
			color: #dc2626;
		}

		.status.success {
			background: rgba(34, 197, 94, 0.2);
			color: #16a34a;
		}

		.test-controls {
			display: flex;
			flex-wrap: wrap;
			gap: 20px;
			margin-bottom: 20px;
			padding: 15px;
			background: white;
			border-radius: 8px;
			border: 1px solid #e5e7eb;
		}

		.scenario-controls,
		.data-controls {
			display: flex;
			gap: 10px;
			align-items: center;
			flex-wrap: wrap;
		}

		.scenario-controls label {
			font-weight: 500;
			color: #374151;
		}

		.scenario-controls select,
		.scenario-controls input {
			padding: 6px 10px;
			border: 1px solid #d1d5db;
			border-radius: 4px;
			font-size: 14px;
		}

		.data-controls label {
			display: flex;
			align-items: center;
			gap: 5px;
			font-size: 14px;
			color: #6b7280;
		}

		.test-controls button {
			padding: 8px 16px;
			background: #3b82f6;
			color: white;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			font-size: 14px;
			font-weight: 500;
			transition: background 0.2s;
		}

		.test-controls button:hover {
			background: #2563eb;
		}

		.test-info {
			display: flex;
			gap: 15px;
			margin-left: auto;
			font-size: 14px;
			color: #6b7280;
		}

		.test-grid-container {
			border: 2px solid #e5e7eb;
			border-radius: 12px;
			overflow: hidden;
			background: #f9fafb;
			position: relative;
			margin-bottom: 20px;
			box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
		}

		.test-validation {
			margin-bottom: 20px;
			padding: 15px;
			background: white;
			border-radius: 8px;
			border: 1px solid #e5e7eb;
		}

		.test-validation h3 {
			margin: 0 0 15px 0;
			color: #374151;
			font-size: 1.1rem;
		}

		.validation-summary {
			display: flex;
			gap: 15px;
			margin-bottom: 15px;
			padding: 10px;
			background: #f9fafb;
			border-radius: 6px;
		}

		.validation-summary span {
			font-size: 14px;
			font-weight: 500;
		}

		.validation-summary .valid {
			color: #16a34a;
		}

		.validation-summary .invalid {
			color: #dc2626;
		}

		.validation-summary .warnings {
			color: #f59e0b;
		}

		.validation-item {
			margin-bottom: 10px;
			padding: 10px;
			border-radius: 6px;
			background: #f8fafc;
			border-left: 4px solid #3b82f6;
		}

		.validation-item.invalid {
			background: #fef2f2;
			border-left-color: #dc2626;
		}

		.validation-item ul {
			margin: 5px 0 0 20px;
			padding: 0;
		}

		.validation-item li {
			font-size: 14px;
			margin-bottom: 3px;
		}

		.validation-item .errors li {
			color: #dc2626;
		}

		.validation-item .warnings li {
			color: #f59e0b;
		}

		.no-validation {
			color: #6b7280;
			font-style: italic;
			text-align: center;
			padding: 20px;
		}

		.test-statistics {
			margin-bottom: 20px;
			padding: 15px;
			background: white;
			border-radius: 8px;
			border: 1px solid #e5e7eb;
		}

		.test-statistics h3 {
			margin: 0 0 15px 0;
			color: #374151;
			font-size: 1.1rem;
		}

		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 15px;
		}

		.stat-item {
			display: flex;
			justify-content: space-between;
			padding: 10px;
			background: #f9fafb;
			border-radius: 6px;
		}

		.stat-label {
			font-weight: 500;
			color: #374151;
		}

		.stat-value {
			color: #6b7280;
			font-family: monospace;
		}

		.test-footer {
			padding: 20px;
			background: linear-gradient(135deg, #10b981 0%, #059669 100%);
			border-radius: 8px;
			color: white;
		}

		.test-footer p {
			margin: 8px 0;
			font-size: 14px;
			line-height: 1.5;
		}

		.test-footer strong {
			font-weight: 600;
		}

		/* Responsive design */
		@media (max-width: 768px) {
			.data-driven-test-container {
				padding: 15px;
			}

			.test-controls {
				flex-direction: column;
				align-items: stretch;
			}

			.scenario-controls,
			.data-controls {
				justify-content: center;
			}

			.test-info {
				margin-left: 0;
				justify-content: center;
			}

			.stats-grid {
				grid-template-columns: 1fr;
			}
		}

		/* Dark mode support */
		@media (prefers-color-scheme: dark) {
			.data-driven-test-container {
				background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
				color: #f3f4f6;
			}

			.test-controls,
			.test-validation,
			.test-statistics {
				background: #374151;
				border-color: #4b5563;
			}

			.test-grid-container {
				border-color: #4b5563;
				background: #1f2937;
			}

			.validation-item {
				background: #374151;
			}

			.validation-item.invalid {
				background: #450a0a;
			}

			.stat-item {
				background: #4b5563;
			}
		}
	</style>
</div>
