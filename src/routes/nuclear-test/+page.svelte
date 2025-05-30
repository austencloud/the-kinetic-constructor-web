<!-- NUCLEAR REBUILD: Minimal working version of your app -->
<script lang="ts">
	// 🚨 NUCLEAR: Single source of truth - no multiple state systems
	import type { PictographData } from '$lib/types/PictographData';

	// 🚨 NUCLEAR: Minimal state that matches your exact data structures
	let startPosition = $state<PictographData | null>(null);
	let beats = $state<PictographData[]>([]);
	let effectCount = $state(0);
	let debugLog = $state<string[]>([]);

	// 🚨 CRITICAL: Match your isEmpty logic exactly
	let isEmpty = $derived(!startPosition && beats.length === 0);

	// Mock start positions (replace with your actual data later)
	const mockStartPositions: PictographData[] = [
		{
			letter: 'α1',
			startPos: 'alpha1',
			endPos: 'alpha1',
			isStartPosition: true,
			redMotionData: {
				motionType: 'static',
				startLoc: 'alpha1',
				endLoc: 'alpha1',
				startOri: 'in',
				endOri: 'in',
				turns: 0
			},
			blueMotionData: {
				motionType: 'static',
				startLoc: 'alpha1',
				endLoc: 'alpha1',
				startOri: 'in',
				endOri: 'in',
				turns: 0
			}
		} as PictographData,
		{
			letter: 'β5',
			startPos: 'beta5',
			endPos: 'beta5',
			isStartPosition: true,
			redMotionData: {
				motionType: 'static',
				startLoc: 'beta5',
				endLoc: 'beta5',
				startOri: 'in',
				endOri: 'in',
				turns: 0
			},
			blueMotionData: {
				motionType: 'static',
				startLoc: 'beta5',
				endLoc: 'beta5',
				startOri: 'in',
				endOri: 'in',
				turns: 0
			}
		} as PictographData
	];

	// Mock options (replace with your actual options service later)
	const mockOptions: PictographData[] = [
		{
			letter: 'A',
			startPos: 'alpha1',
			endPos: 'beta2',
			redMotionData: {
				motionType: 'pro',
				startLoc: 'alpha1',
				endLoc: 'beta2',
				startOri: 'in',
				endOri: 'out',
				turns: 1
			},
			blueMotionData: {
				motionType: 'anti',
				startLoc: 'alpha1',
				endLoc: 'beta2',
				startOri: 'in',
				endOri: 'out',
				turns: 1
			}
		} as PictographData,
		{
			letter: 'B',
			startPos: 'alpha1',
			endPos: 'gamma3',
			redMotionData: {
				motionType: 'pro',
				startLoc: 'alpha1',
				endLoc: 'gamma3',
				startOri: 'in',
				endOri: 'in',
				turns: 2
			},
			blueMotionData: {
				motionType: 'anti',
				startLoc: 'alpha1',
				endLoc: 'gamma3',
				startOri: 'in',
				endOri: 'in',
				turns: 2
			}
		} as PictographData
	];

	// 🚨 NUCLEAR: Direct functions - no reactive chains, no state modifications in functions
	function setStartPosition(startPos: PictographData) {
		console.log(`🎯 NUCLEAR: Setting start position: ${startPos.letter}`);
		debugLog = [
			...debugLog,
			`[${new Date().toLocaleTimeString()}] Start position selected: ${startPos.letter}`
		];
		startPosition = { ...startPos };
		console.log(`🎯 NUCLEAR: Start position set. isEmpty: ${isEmpty}`);
		debugLog = [...debugLog, `[${new Date().toLocaleTimeString()}] isEmpty is now: ${isEmpty}`];
	}

	function addBeat(beat: PictographData) {
		console.log(`📝 NUCLEAR: Adding beat: ${beat.letter}`);
		debugLog = [...debugLog, `[${new Date().toLocaleTimeString()}] Beat added: ${beat.letter}`];
		beats = [...beats, { ...beat }];
		console.log(`📝 NUCLEAR: Beat added. Total beats: ${beats.length}, isEmpty: ${isEmpty}`);
		debugLog = [...debugLog, `[${new Date().toLocaleTimeString()}] Total beats: ${beats.length}`];
	}

	function clearSequence() {
		console.log('🧹 NUCLEAR: Clearing sequence');
		debugLog = [...debugLog, `[${new Date().toLocaleTimeString()}] Sequence cleared`];
		startPosition = null;
		beats = [];
		console.log('🧹 NUCLEAR: Sequence cleared');
	}

	// 🚨 TESTING EFFECTS ONE BY ONE
	// Effects will be inserted here during testing
</script>

<div class="nuclear-container">
	<h1>🚨 NUCLEAR TEST: Minimal Working Version</h1>
	<p>This tests your exact architecture without infinite loops</p>

	<div class="status-bar">
		<span class="status-item">isEmpty: <strong>{isEmpty}</strong></span>
		<span class="status-item">Start: <strong>{startPosition?.letter || 'None'}</strong></span>
		<span class="status-item">Beats: <strong>{beats.length}</strong></span>
		<span class="status-item" class:error={effectCount > 20}
			>Effects: <strong>{effectCount}</strong></span
		>
	</div>

	<div class="main-layout">
		<!-- LEFT PANEL: Start Position Picker OR Option Picker -->
		<div class="left-panel">
			{#if isEmpty}
				<!-- START POSITION PICKER -->
				<div class="picker start-position-picker">
					<h3>🎯 Select Start Position</h3>
					<p>Choose a start position to begin:</p>

					{#each mockStartPositions as startPos}
						<button
							class="picker-item start-position-item"
							onclick={() => setStartPosition(startPos)}
						>
							<div class="item-letter">{startPos.letter}</div>
							<div class="item-details">{startPos.startPos} → {startPos.endPos}</div>
						</button>
					{/each}
				</div>
			{:else}
				<!-- OPTION PICKER -->
				<div class="picker option-picker">
					<h3>📝 Select Next Beat</h3>
					<p>Start: <strong>{startPosition?.letter}</strong></p>

					{#each mockOptions as option}
						<button class="picker-item option-item" onclick={() => addBeat(option)}>
							<div class="item-letter">{option.letter}</div>
							<div class="item-details">{option.startPos} → {option.endPos}</div>
						</button>
					{/each}

					<button class="clear-button" onclick={clearSequence}> Clear Sequence </button>
				</div>
			{/if}
		</div>

		<!-- RIGHT PANEL: Beat Frame -->
		<div class="right-panel">
			<div class="beat-frame">
				<h3>🎵 Beat Frame</h3>

				<!-- Start Position Display -->
				{#if startPosition}
					<div class="beat-item start-beat">
						<div class="beat-header">Start Position</div>
						<div class="beat-letter">{startPosition.letter}</div>
						<div class="beat-details">{startPosition.startPos}</div>
					</div>
				{/if}

				<!-- Beats Display -->
				{#if beats.length === 0}
					<div class="beat-item empty-beat">
						{startPosition ? 'Ready for beats...' : 'Select a start position'}
					</div>
				{:else}
					{#each beats as beat, index}
						<div class="beat-item regular-beat">
							<div class="beat-header">Beat {index + 1}</div>
							<div class="beat-letter">{beat.letter}</div>
							<div class="beat-details">{beat.startPos} → {beat.endPos}</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- DEBUG PANEL -->
	<div class="debug-panel">
		<h4>🔧 Debug Log</h4>
		<div class="debug-log">
			{#each debugLog as logEntry}
				<div class="log-entry">{logEntry}</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.nuclear-container {
		padding: 20px;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
		color: white;
	}

	.status-bar {
		display: flex;
		gap: 20px;
		background: rgba(255, 255, 255, 0.1);
		padding: 10px 20px;
		border-radius: 8px;
		margin-bottom: 20px;
		backdrop-filter: blur(10px);
	}

	.status-item {
		font-size: 14px;
	}

	.status-item.error {
		color: #ff6b6b;
		font-weight: bold;
	}

	.main-layout {
		display: flex;
		gap: 20px;
		margin-bottom: 20px;
	}

	.left-panel,
	.right-panel {
		flex: 1;
	}

	.picker,
	.beat-frame {
		background: rgba(255, 255, 255, 0.95);
		color: #333;
		padding: 20px;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(10px);
	}

	.picker-item {
		width: 100%;
		background: #f8f9fa;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		padding: 15px;
		margin: 10px 0;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.picker-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.start-position-item {
		border-color: #28a745;
		background: #d4edda;
	}

	.start-position-item:hover {
		background: #c3e6cb;
	}

	.option-item {
		border-color: #007bff;
		background: #d1ecf1;
	}

	.option-item:hover {
		background: #bee5eb;
	}

	.item-letter {
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 5px;
	}

	.item-details {
		font-size: 12px;
		color: #666;
	}

	.beat-item {
		background: #f8f9fa;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		padding: 15px;
		margin: 10px 0;
		text-align: center;
	}

	.start-beat {
		border-color: #28a745;
		background: #d4edda;
	}

	.regular-beat {
		border-color: #6f42c1;
		background: #e2d9f3;
	}

	.empty-beat {
		border: 2px dashed #ccc;
		color: #999;
		font-style: italic;
	}

	.beat-header {
		font-size: 12px;
		color: #666;
		margin-bottom: 5px;
	}

	.beat-letter {
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 5px;
	}

	.beat-details {
		font-size: 12px;
		color: #666;
	}

	.clear-button {
		width: 100%;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 10px;
		margin-top: 15px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.clear-button:hover {
		background: #c82333;
	}

	.debug-panel {
		background: rgba(0, 0, 0, 0.8);
		padding: 15px;
		border-radius: 8px;
		backdrop-filter: blur(10px);
	}

	.debug-log {
		max-height: 200px;
		overflow-y: auto;
		font-family: 'Courier New', monospace;
		font-size: 12px;
	}

	.log-entry {
		padding: 2px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>
