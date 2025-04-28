<script lang="ts">
	import { onMount } from 'svelte';
	import { learnStore, currentQuestion, currentAnswers } from '$lib/state/stores/learn/learnStore';
	import QuestionDisplay from './QuestionDisplay.svelte';
	import AnswerOptions from './AnswerOptions.svelte';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import FeedbackIndicator from './FeedbackIndicator.svelte';
	import BackButton from './shared/BackButton.svelte';

	// Handle feedback display timing
	let showFeedback = false;
	let feedbackTimeout: number;

	// Function to handle answer selection
	function handleAnswerSelect(answer: any) {
		learnStore.submitAnswer(answer);
		showFeedback = true;

		// Clear any existing timeout
		if (feedbackTimeout) {
			clearTimeout(feedbackTimeout);
		}

		// Show feedback for 1.5 seconds
		feedbackTimeout = setTimeout(() => {
			showFeedback = false;

			// If answer was correct, move to next question
			if ($learnStore.isAnswerCorrect) {
				learnStore.nextQuestionOrEnd();

				// If we've moved to the next question, generate it
				if ($learnStore.currentView === 'lesson') {
					learnStore.generateNextQuestion();
				}
			}
		}, 1500);
	}

	function handleBack() {
		learnStore.goBackToSelector();
	}

	// Clean up on unmount
	onMount(() => {
		return () => {
			if (feedbackTimeout) {
				clearTimeout(feedbackTimeout);
			}
		};
	});
</script>

<div class="lesson-widget">
	<header>
		<div class="header-left">
			<BackButton on:click={handleBack} />
		</div>

		<div class="header-center">
			<h1>{$learnStore.lessonConfig?.title || 'Lesson'}</h1>
			<ProgressIndicator />
		</div>

		<div class="header-right">
			<!-- Could add additional controls here -->
		</div>
	</header>

	<div class="content">
		<div class="question-section">
			{#if $learnStore.lessonConfig}
				<div class="prompt">{$learnStore.lessonConfig.prompt}</div>
				<QuestionDisplay
					questionFormat={$learnStore.lessonConfig.questionFormat}
					questionData={$currentQuestion}
				/>
			{/if}
		</div>

		<div class="answer-section">
			{#if $learnStore.lessonConfig}
				<AnswerOptions
					answerFormat={$learnStore.lessonConfig.answerFormat}
					options={$currentAnswers}
					disabled={showFeedback}
					on:select={(e) => handleAnswerSelect(e.detail)}
				/>
			{/if}
		</div>
	</div>

	{#if showFeedback}
		<FeedbackIndicator isCorrect={$learnStore.isAnswerCorrect} />
	{/if}
</div>

<style>
	.lesson-widget {
		display: flex;
		flex-direction: column;
		max-width: 900px;
		margin: 0 auto;
		width: 100%;
		height: 100%;
		position: relative;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.header-center {
		text-align: center;
	}

	h1 {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}

	.header-left,
	.header-right {
		min-width: 80px;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.question-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.prompt {
		font-size: 1.2rem;
		opacity: 0.9;
		margin-bottom: 0.5rem;
	}

	.answer-section {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	@media (max-width: 768px) {
		.content {
			gap: 2rem;
		}

		.prompt {
			font-size: 1rem;
		}
	}
</style>
