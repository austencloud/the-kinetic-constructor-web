<script lang="ts">
	import ButtonAnswers from './ButtonAnswers.svelte';
	import PictographAnswers from './PictographAnswers.svelte';
	import type { AnswerFormat } from '$lib/state/stores/learn/lesson_configs';

	// Props using Svelte 5 runes
	const {
		answerFormat = 'button',
		options = [],
		disabled = false,
		onselect
	} = $props<{
		answerFormat?: AnswerFormat;
		options?: any[];
		disabled?: boolean;
		onselect?: (option: any) => void;
	}>();

	function handleSelect(option: any) {
		if (!disabled) {
			onselect?.(option);
		}
	}
</script>

<div class="answer-options">
	{#if answerFormat === 'button'}
		<ButtonAnswers {options} {disabled} onselect={handleSelect} />
	{:else if answerFormat === 'pictograph'}
		<PictographAnswers pictographs={options} {disabled} onselect={handleSelect} />
	{/if}
</div>

<style>
	.answer-options {
		width: 100%;
		max-width: 800px;
	}
</style>
