<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let row: number;
	export let cue: string = '';
	export let timestamp: string = '';

	const dispatch = createEventDispatcher();

	let isEditingCue = false;
	let isEditingTimestamp = false;
	let cueInput: HTMLInputElement;
	let timestampInput: HTMLInputElement;
	let currentCue = cue;
	let currentTimestamp = timestamp;
	// Define the timestamp pattern for validation
	const timestampPattern = '\\d{1,2}:\\d{2}';

	// Update the current values when the props change
	$: currentCue = cue;
	$: currentTimestamp = timestamp;

	function startEditingCue() {
		isEditingCue = true;

		// Focus the input after the DOM updates
		setTimeout(() => {
			if (cueInput) {
				cueInput.focus();
				cueInput.select();
			}
		}, 0);
	}

	function startEditingTimestamp() {
		isEditingTimestamp = true;

		// Focus the input after the DOM updates
		setTimeout(() => {
			if (timestampInput) {
				timestampInput.focus();
				timestampInput.select();
			}
		}, 0);
	}

	function saveCue() {
		dispatch('update', { row, cue: currentCue, timestamp: currentTimestamp });
		isEditingCue = false;
	}

	function saveTimestamp() {
		// Validate timestamp format (MM:SS)
		if (currentTimestamp && !/^\d{1,2}:\d{2}$/.test(currentTimestamp)) {
			// If invalid, revert to the original timestamp
			currentTimestamp = timestamp;
		}

		dispatch('update', { row, cue: currentCue, timestamp: currentTimestamp });
		isEditingTimestamp = false;
	}

	function handleCueKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveCue();
		} else if (event.key === 'Escape') {
			// Revert to the original cue
			currentCue = cue;
			isEditingCue = false;
		}
	}

	function handleTimestampKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveTimestamp();
		} else if (event.key === 'Escape') {
			// Revert to the original timestamp
			currentTimestamp = timestamp;
			isEditingTimestamp = false;
		}
	}

	function handleCueBlur() {
		saveCue();
	}

	function handleTimestampBlur() {
		saveTimestamp();
	}
</script>

<div class="cue-box" style="--row: {row};">
	<div class="cue-content">
		<div class="cue-field">
			{#if isEditingCue}
				<input
					bind:this={cueInput}
					bind:value={currentCue}
					on:keydown={handleCueKeyDown}
					on:blur={handleCueBlur}
					class="cue-input"
					type="text"
					placeholder="Enter cue"
				/>
			{:else}
				<button class="cue-text" on:click={startEditingCue} type="button" aria-label="Edit cue">
					{currentCue || 'Add cue...'}
				</button>
			{/if}
		</div>

		<div class="timestamp-field">
			{#if isEditingTimestamp}
				<input
					bind:this={timestampInput}
					bind:value={currentTimestamp}
					on:keydown={handleTimestampKeyDown}
					on:blur={handleTimestampBlur}
					class="timestamp-input"
					type="text"
					placeholder="MM:SS"
					pattern={timestampPattern}
				/>
			{:else}
				<button
					class="timestamp-text"
					on:click={startEditingTimestamp}
					type="button"
					aria-label="Edit timestamp"
				>
					{currentTimestamp || '--:--'}
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.cue-box {
		height: var(--cell-size, 80px);
		min-height: var(--cell-size, 80px); /* Ensure minimum height */
		max-height: var(--cell-size, 80px); /* Ensure maximum height */
		border-bottom: 1px solid #333;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		box-sizing: border-box; /* Include padding in height calculation */
	}

	.cue-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.cue-field,
	.timestamp-field {
		position: relative;
	}

	.cue-text,
	.timestamp-text {
		padding: 0.25rem;
		border-radius: 4px;
		cursor: text;
		transition: background-color 0.2s;
		font-size: 0.875rem;
		background: none;
		border: none;
		text-align: left;
		width: 100%;
	}

	.cue-text {
		color: #e0e0e0;
		font-family: inherit;
	}

	.timestamp-text {
		color: #999;
		font-family: monospace;
	}

	.cue-text:hover,
	.timestamp-text:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.cue-input,
	.timestamp-input {
		width: 100%;
		padding: 0.25rem;
		background-color: #333;
		color: #fff;
		border: 1px solid #555;
		border-radius: 4px;
		outline: none;
		font-size: 0.875rem;
	}

	.timestamp-input {
		font-family: monospace;
	}

	.cue-input:focus,
	.timestamp-input:focus {
		border-color: #3498db;
	}

	/* Empty state styling */
	.cue-text:empty::before {
		content: 'Add cue...';
		color: #666;
		font-style: italic;
	}

	.timestamp-text:empty::before {
		content: '--:--';
		color: #666;
	}
</style>
