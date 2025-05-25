<script lang="ts">
	import type { LessonMode } from '$lib/state/stores/learn/learnStore';

	// Props using Svelte 5 runes
	let { selected = $bindable('fixed_question'), onchange } = $props<{
		selected?: LessonMode;
		onchange?: (mode: LessonMode) => void;
	}>();

	function handleSelect(mode: LessonMode) {
		if (mode !== selected) {
			selected = mode;
			onchange?.(mode);
		}
	}
</script>

<div class="mode-toggle">
	<button
		class="toggle-button {selected === 'fixed_question' ? 'selected' : ''}"
		onclick={() => handleSelect('fixed_question')}
		aria-pressed={selected === 'fixed_question'}
	>
		Fixed Questions
	</button>

	<button
		class="toggle-button {selected === 'countdown' ? 'selected' : ''}"
		onclick={() => handleSelect('countdown')}
		aria-pressed={selected === 'countdown'}
	>
		Countdown
	</button>
</div>

<style>
	.mode-toggle {
		display: flex;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid var(--color-border, #444);
	}

	.toggle-button {
		padding: 0.5rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-text, white);
		transition: background-color 0.2s ease;
	}

	.toggle-button.selected {
		background-color: var(--color-primary, #3e63dd);
	}

	.toggle-button:not(.selected) {
		background-color: var(--color-surface-700, #2d2d2d);
	}

	.toggle-button:not(.selected):hover {
		background-color: var(--color-surface-600, #3d3d3d);
	}
</style>
