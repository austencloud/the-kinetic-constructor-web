<script lang="ts">
	import { learnStore, type LessonMode } from '$lib/state/stores/learn/learnStore';
	import { lessonConfigs } from '$lib/state/stores/learn/lesson_configs';
	import LessonModeToggle from './LessonModeToggle.svelte';

	function selectLesson(lessonId: string) {
		learnStore.selectLesson(lessonId);
		learnStore.startLesson();
	}

	function handleModeChange(mode: LessonMode) {
		learnStore.setMode(mode);
	}
</script>

<div class="lesson-selector">
	<header>
		<h1>Learning Module</h1>
		<p>Select a lesson to begin learning about pictographs.</p>

		<div class="mode-selector">
			<span>Mode:</span>
			<LessonModeToggle
				selected={$learnStore.selectedMode}
				on:change={(e) => handleModeChange(e.detail)}
			/>
		</div>
	</header>

	<div class="lessons-grid">
		{#each lessonConfigs as lesson}
			<button class="lesson-button" on:click={() => selectLesson(lesson.id)}>
				<h2>{lesson.title}</h2>
				<div class="lesson-description">{lesson.description}</div>
				<div class="lesson-format">
					<span class="format-label">Question: {lesson.questionFormat}</span>
					<span class="format-label">Answer: {lesson.answerFormat}</span>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.lesson-selector {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	header {
		text-align: center;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.mode-selector {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.lessons-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.lesson-button {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		border-radius: 8px;
		background-color: var(--color-surface-700, #2d2d2d);
		border: 1px solid var(--color-surface-600, #3d3d3d);
		color: var(--color-text, white);
		text-align: left;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.lesson-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
		background-color: var(--color-surface-600, #3d3d3d);
	}

	.lesson-button h2 {
		font-size: 1.25rem;
		margin: 0 0 0.75rem 0;
	}

	.lesson-description {
		flex-grow: 1;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.lesson-format {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		opacity: 0.8;
	}

	.format-label {
		background-color: var(--color-surface-800, #1d1d1d);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		text-transform: capitalize;
	}
</style>
