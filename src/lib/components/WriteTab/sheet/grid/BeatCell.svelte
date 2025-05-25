<script lang="ts">
	import { selectionState } from '../../stores/selectionStore';
	import { actState } from '../../state/actState.svelte';
	import { uiState } from '../../state/uiState.svelte';
	import ConfirmationModal from '../../../shared/ConfirmationModal.svelte';
	import type { Beat } from '../../models/Act';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { browser } from '$app/environment';

	// Props using Svelte 5 runes
	const {
		row,
		col,
		beat = undefined,
		onclick
	} = $props<{
		row: number;
		col: number;
		beat?: Beat;
		onclick?: (event: { row: number; col: number }) => void;
	}>();

	// Modal state
	let isEraseBeatModalOpen = $state(false);

	// Derived state using Svelte 5 runes
	const isSelected = $derived(() => {
		const selectedBeat = selectionState.selectedBeat();
		return selectedBeat?.row === row && selectedBeat?.col === col;
	});
	const isFilled = $derived(beat?.is_filled || !!beat?.pictograph_data);
	const beatNumber = $derived(beat?.beat_number || row * 8 + col + 1);

	// Handle click events
	function handleClick() {
		// Provide haptic feedback when selecting a beat
		if (browser) {
			hapticFeedbackService.trigger('selection');
		}

		onclick?.({ row, col });
	}

	// Handle erase click
	function handleEraseClick(event: MouseEvent) {
		event.stopPropagation(); // Prevent selection

		// Provide warning haptic feedback for deletion
		if (browser) {
			hapticFeedbackService.trigger('warning');
		}

		if (uiState.showConfirmDeletions) {
			isEraseBeatModalOpen = true;
		} else {
			actState.eraseBeat(row, col);
		}
	}

	// Handle confirmation from modal
	function confirmEraseBeat() {
		// Provide warning haptic feedback for confirmed deletion
		if (browser) {
			hapticFeedbackService.trigger('warning');
		}

		actState.eraseBeat(row, col);
		isEraseBeatModalOpen = false;
	}
</script>

<div
	class="beat-cell"
	class:filled={isFilled}
	class:selected={isSelected}
	data-row={row}
	data-col={col}
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	tabindex="0"
	role="button"
	aria-label={`Beat ${beatNumber}`}
>
	{#if isFilled}
		<div class="beat-content">
			<!-- Placeholder for pictograph visualization -->
			<div class="pictograph-placeholder">
				<span class="beat-number">{beatNumber}</span>
				<button class="erase-button" onclick={handleEraseClick} aria-label="Erase beat">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 6h18"></path>
						<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
						<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
						<line x1="10" y1="11" x2="10" y2="17"></line>
						<line x1="14" y1="11" x2="14" y2="17"></line>
					</svg>
				</button>
			</div>
		</div>
	{:else}
		<div class="empty-cell">
			<span class="beat-number">{beatNumber}</span>
		</div>
	{/if}
</div>

<ConfirmationModal
	isOpen={isEraseBeatModalOpen}
	title="Erase Beat"
	message={`Are you sure you want to erase beat ${beatNumber}?`}
	confirmText="Erase"
	cancelText="Cancel"
	confirmButtonClass="danger"
	onconfirm={confirmEraseBeat}
	onclose={() => (isEraseBeatModalOpen = false)}
/>

<style>
	.beat-cell {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #222;
		border-radius: 4px;
		cursor: pointer;
		transition:
			background-color 0.2s,
			transform 0.1s;
		user-select: none;
	}

	.beat-cell:hover {
		background-color: #2a2a2a;
	}

	.beat-cell.filled {
		background-color: #2c3e50;
	}

	.beat-cell.filled:hover {
		background-color: #34495e;
	}

	.beat-cell.selected {
		background-color: #2980b9;
		transform: scale(0.95);
		box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
		z-index: 1;
	}

	.beat-content {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pictograph-placeholder {
		width: 90%;
		height: 90%;
		background-color: #3498db;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		position: relative; /* For absolute positioning of beat number */
	}

	.empty-cell {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #555;
	}

	.beat-number {
		font-size: clamp(0.6rem, 1vw, 1rem); /* Responsive font size */
		opacity: 0.7;
		position: absolute;
		top: 4px;
		left: 4px;
		background-color: transparent; /* Transparent background */
	}

	.erase-button {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.3);
		border: none;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 0.2s,
			background-color 0.2s;
	}

	.pictograph-placeholder:hover .erase-button {
		opacity: 1;
	}

	.erase-button:hover {
		background-color: rgba(231, 76, 60, 0.8);
	}
</style>
