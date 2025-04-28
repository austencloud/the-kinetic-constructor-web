<script lang="ts">
	import { learnStore } from '$lib/state/stores/learn/learnStore';
	import LessonSelector from './LessonSelector.svelte';
	import LessonWidget from './LessonWidget.svelte';
	import LessonResults from './LessonResults.svelte';
</script>

<div class="learn-tab">
	{#if $learnStore.currentView === 'selector'}
		<LessonSelector />
	{:else if $learnStore.currentView === 'lesson'}
		<LessonWidget />
	{:else if $learnStore.currentView === 'results'}
		<LessonResults />
	{/if}
</div>

<style>
	.learn-tab {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		padding: 1rem;
		overflow: hidden;
	}
</style>
