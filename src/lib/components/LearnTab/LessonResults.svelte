<script lang="ts">
	import { learnStore, quizResults } from '$lib/state/stores/learn/learnStore';
	import BackButton from './shared/BackButton.svelte';
	import StartOverButton from './shared/StartOverButton.svelte';

	// Calculate percentage score
	$: percentage = Math.round(($quizResults.score / $quizResults.total) * 100);
	$: isPassing = percentage >= 70;
</script>

<div class="lesson-results">
	<div class="results-container">
		<h1>Quiz Results</h1>

		<div class="score-display {isPassing ? 'passing' : 'failing'}">
			<div class="percentage">{percentage}%</div>
			<div class="fraction">{$quizResults.score} / {$quizResults.total}</div>
		</div>

		<div class="feedback-message">
			{#if isPassing}
				<p>Great job! You've demonstrated good understanding!</p>
			{:else}
				<p>Keep practicing! Try again to improve your score.</p>
			{/if}
		</div>

		<div class="stats">
			<div class="stat">
				<div class="stat-label">Questions</div>
				<div class="stat-value">{$quizResults.total}</div>
			</div>
			<div class="stat">
				<div class="stat-label">Correct</div>
				<div class="stat-value">{$quizResults.score}</div>
			</div>
			<div class="stat">
				<div class="stat-label">Incorrect</div>
				<div class="stat-value">{$quizResults.total - $quizResults.score}</div>
			</div>
		</div>

		<div class="actions">
			<BackButton on:click={() => learnStore.goBackToSelector()}>Back to Lessons</BackButton>
			<StartOverButton on:click={() => learnStore.startOver()}>Try Again</StartOverButton>
		</div>
	</div>
</div>

<style>
	.lesson-results {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 2rem 1rem;
	}

	.results-container {
		background-color: var(--color-surface-700, #2d2d2d);
		border-radius: 12px;
		padding: 2rem;
		width: 100%;
		max-width: 500px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		text-align: center;
	}

	h1 {
		margin-bottom: 1.5rem;
		font-size: 1.75rem;
	}

	.score-display {
		margin: 1rem 0 2rem;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.passing {
		background-color: rgba(67, 160, 71, 0.2);
	}

	.failing {
		background-color: rgba(229, 57, 53, 0.2);
	}

	.percentage {
		font-size: 3.5rem;
		font-weight: 700;
		line-height: 1;
	}

	.fraction {
		font-size: 1.25rem;
		opacity: 0.8;
		margin-top: 0.5rem;
	}

	.feedback-message {
		margin-bottom: 2rem;
	}

	.stats {
		display: flex;
		justify-content: space-around;
		margin: 1.5rem 0 2rem;
	}

	.stat-label {
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.7;
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1rem;
	}

	@media (max-width: 600px) {
		.results-container {
			padding: 1.5rem;
		}

		.percentage {
			font-size: 2.5rem;
		}

		.stats {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
