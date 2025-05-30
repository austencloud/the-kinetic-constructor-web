<!-- Minimal Svelte 5 Test: Start Position → Option Selection → Beat Frame -->
<script lang="ts">
	// NUCLEAR TEST: Matches your exact architecture flow
	// Goal: Start position → option selection → beat frame updates with ZERO infinite loops

	interface StartPosition {
		id: string;
		letter: string;
		startPos: string;
		endPos: string;
		isStartPosition: true;
	}

	interface Beat {
		id: string;
		letter: string;
		name: string;
		timestamp: string;
	}

	// 🚨 NUCLEAR: Match your exact state structure
	let startPosition = $state<StartPosition | null>(null);
	let beats = $state<Beat[]>([]);
	let selectionCount = $state(0);
	let updateCount = $state(0);
	let effectCount = $state(0);
	let lastSelected = $state('None');

	// 🚨 CRITICAL: Match your isEmpty logic exactly
	let isEmpty = $derived(!startPosition && beats.length === 0);

	// Static start positions - match your data structure
	const startPositions: StartPosition[] = [
		{ id: 'alpha1', letter: 'α1', startPos: 'alpha1', endPos: 'alpha1', isStartPosition: true },
		{ id: 'beta5', letter: 'β5', startPos: 'beta5', endPos: 'beta5', isStartPosition: true },
		{ id: 'gamma11', letter: 'γ11', startPos: 'gamma11', endPos: 'gamma11', isStartPosition: true }
	];

	// Static options - only show after start position selected
	const options = [
		{ id: 'A', letter: 'A', name: 'Option A' },
		{ id: 'B', letter: 'B', name: 'Option B' },
		{ id: 'C', letter: 'C', name: 'Option C' },
		{ id: 'D', letter: 'D', name: 'Option D' },
		{ id: 'E', letter: 'E', name: 'Option E' }
	];

	// 🚨 NUCLEAR: Match your setStartPosition flow
	function selectStartPosition(startPos: StartPosition) {
		console.log('🔧 MINIMAL: Setting start position:', startPos.letter);

		selectionCount++;
		lastSelected = `Start: ${startPos.letter}`;

		// Direct assignment - match your sequenceState.setStartPosition
		startPosition = { ...startPos };
		updateCount++;

		console.log('🔧 MINIMAL: Start position set. isEmpty:', isEmpty);
	}

	// 🚨 NUCLEAR: Match your addBeat flow
	function selectOption(option: (typeof options)[0]) {
		console.log('🔧 MINIMAL: Adding beat:', option.letter);

		selectionCount++;
		lastSelected = `Beat: ${option.letter}`;

		// Add beat to sequence - match your sequenceState.addBeat
		const newBeat: Beat = {
			id: `beat-${Date.now()}`,
			letter: option.letter,
			name: option.name,
			timestamp: new Date().toLocaleTimeString()
		};

		beats = [...beats, newBeat];
		updateCount++;

		console.log('🔧 MINIMAL: Beat added. Total beats:', beats.length, 'isEmpty:', isEmpty);
	}

	// 🚨 NUCLEAR: Single effect to monitor for loops
	$effect(() => {
		effectCount++;
		console.log(
			'🔧 MINIMAL: Effect ran. Count:',
			effectCount,
			'isEmpty:',
			isEmpty,
			'StartPos:',
			!!startPosition,
			'Beats:',
			beats.length
		);

		// CRITICAL: If this logs more than 2-3 times per user action, we have a loop
		if (effectCount > 15) {
			console.error('🚨 INFINITE LOOP DETECTED in minimal test!');
		}
	});
</script>

<div class="container">
	<h1>Minimal Svelte 5 Test</h1>
	<p>
		Testing: Start Position → Option Selection → Beat Frame (Effect count should be ≤ 3 per click)
	</p>
	<p>
		<strong>isEmpty: {isEmpty}</strong> | Start Position: {startPosition?.letter || 'None'} | Beats:
		{beats.length}
	</p>

	<div class="layout">
		<!-- START POSITION PICKER (shows when isEmpty = true) -->
		{#if isEmpty}
			<div class="start-position-picker">
				<h3>🎯 Select Start Position</h3>
				<p>Choose a start position to begin your sequence:</p>
				{#each startPositions as startPos}
					<button class="start-position" onclick={() => selectStartPosition(startPos)}>
						{startPos.letter} ({startPos.startPos})
					</button>
				{/each}

				<div class="debug">
					<div>State: Start Position Selection</div>
					<div>isEmpty: {isEmpty}</div>
				</div>
			</div>
		{:else}
			<!-- OPTION PICKER (shows when isEmpty = false) -->
			<div class="option-picker">
				<h3>📝 Select Options</h3>
				<p>Start Position: <strong>{startPosition?.letter}</strong></p>
				{#each options as option}
					<button class="option" onclick={() => selectOption(option)}>
						{option.letter}: {option.name}
					</button>
				{/each}

				<div class="debug">
					<div>State: Option Selection</div>
					<div>Selection Count: {selectionCount}</div>
					<div>Last Selected: {lastSelected}</div>
				</div>
			</div>
		{/if}

		<!-- BEAT FRAME (always visible) -->
		<div class="beat-frame">
			<h3>🎵 Beat Frame</h3>

			<!-- Start Position Display -->
			{#if startPosition}
				<div class="start-position-display">
					<strong>Start:</strong>
					{startPosition.letter} ({startPosition.startPos})
				</div>
			{/if}

			<!-- Beats Display -->
			{#if beats.length === 0}
				<div class="beat empty">
					{startPosition ? 'Ready for beats...' : 'No start position selected'}
				</div>
			{:else}
				{#each beats as beat}
					<div class="beat">
						<strong>{beat.letter}</strong>: {beat.name}
						<br /><small>Added at: {beat.timestamp}</small>
					</div>
				{/each}
			{/if}

			<div class="debug">
				<div>Beat Count: {beats.length}</div>
				<div>Update Count: {updateCount}</div>
				<div>Has Start Position: {!!startPosition}</div>
			</div>
		</div>
	</div>

	<div class="effect-counter" class:warning={effectCount > 15}>
		Effect Executions: {effectCount}
		{#if effectCount > 15}
			<span class="error">⚠️ INFINITE LOOP!</span>
		{/if}
	</div>
</div>

<style>
	.container {
		padding: 20px;
		font-family: Arial, sans-serif;
		background: #f5f5f5;
		min-height: 100vh;
	}

	.layout {
		display: flex;
		gap: 20px;
		max-width: 1200px;
	}

	.option-picker,
	.start-position-picker {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		width: 300px;
	}

	.start-position-picker {
		border: 2px solid #4caf50;
	}

	.beat-frame {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		flex: 1;
	}

	.option,
	.start-position {
		border-radius: 4px;
		padding: 10px;
		margin: 5px 0;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		text-align: left;
	}

	.option {
		background: #e3f2fd;
		border: 2px solid #2196f3;
	}

	.option:hover {
		background: #bbdefb;
		transform: translateY(-1px);
	}

	.start-position {
		background: #e8f5e8;
		border: 2px solid #4caf50;
	}

	.start-position:hover {
		background: #c8e6c9;
		transform: translateY(-1px);
	}

	.start-position-display {
		background: #e8f5e8;
		border: 1px solid #4caf50;
		padding: 10px;
		margin: 10px 0;
		border-radius: 4px;
		font-weight: bold;
	}

	.beat {
		background: #f3e5f5;
		border: 2px solid #9c27b0;
		border-radius: 4px;
		padding: 15px;
		margin: 10px 0;
		min-height: 60px;
	}

	.beat.empty {
		background: #fafafa;
		border: 2px dashed #ccc;
		color: #999;
		text-align: center;
		line-height: 60px;
	}

	.debug {
		background: #fff3e0;
		border: 1px solid #ff9800;
		padding: 10px;
		margin: 10px 0;
		border-radius: 4px;
		font-family: monospace;
		font-size: 12px;
	}

	.effect-counter {
		background: #e8f5e8;
		border: 1px solid #4caf50;
		padding: 10px;
		border-radius: 4px;
		margin: 20px 0;
		font-size: 14px;
		font-weight: bold;
	}

	.effect-counter.warning {
		background: #ffebee;
		border-color: #f44336;
		color: #d32f2f;
	}

	.error {
		color: #d32f2f;
		font-weight: bold;
	}
</style>
