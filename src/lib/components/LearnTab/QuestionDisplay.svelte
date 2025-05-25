<script lang="ts">
	import TextQuestion from './TextQuestion.svelte';
	import PictographQuestion from './PictographQuestion.svelte';
	import type { QuestionFormat } from '$lib/state/stores/learn/lesson_configs';

	// Props using Svelte 5 runes
	const { questionFormat = 'text', questionData = null } = $props<{
		questionFormat?: QuestionFormat;
		questionData?: any;
	}>();
</script>

<div class="question-display">
	{#if questionFormat === 'text'}
		<TextQuestion text={questionData} />
	{:else if questionFormat === 'pictograph'}
		<PictographQuestion pictograph={questionData} />
	{/if}
</div>

<style>
	.question-display {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1.5rem;
		min-height: 150px;
	}
</style>
