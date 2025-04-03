<!-- src/lib/components/OptionPicker/components/OptionSection.svelte -->
<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import Option from '../Option.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';

	export let title: string;
	export let options: PictographData[] = [];
	export let expanded: boolean = true;

	function toggleExpanded() {
		expanded = !expanded;
	}

	function getLetterTypeIcon(type: string): string {
		switch (type.toLowerCase()) {
			case 'alpha':
				return 'α';
			case 'beta':
				return 'β';
			case 'gamma':
				return 'γ';
			default:
				return '#';
		}
	}
</script>

<div class="section">
	<div
		class="section-header"
		on:click={toggleExpanded}
		on:keydown={(e) => e.key === 'Enter' && toggleExpanded()}
		tabindex="0"
		role="button"
		aria-expanded={expanded}
	>
		<div class="section-title">
			<span class="section-icon">{getLetterTypeIcon(title)}</span>
			<h3>{title} Letters ({options.length})</h3>
		</div>
		<span class="toggle-icon">{expanded ? '▼' : '►'}</span>
	</div>

	{#if expanded}
		<div class="section-content" transition:fly={{ y: -20, duration: 300 }}>
			{#if options.length === 0}
				<div class="empty-message" in:fade={{ duration: 200 }}>
					No options available in this section
				</div>
			{:else}
				<div class="options-grid">
					{#each options as option, i (`${option.letter}-${i}`)}
						<div animate:flip={{ duration: 200 }}>
							<Option
								name={option.letter || `Option ${i + 1}`}
								pictographData={option}
								selectedPictographStore={selectedPictograph}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.section {
		margin-bottom: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		background-color: white;
	}

	.section-header {
		padding: 0.75rem 1rem;
		background-color: #f5f5f5;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		user-select: none;
		transition: background-color 0.2s;
	}

	.section-header:hover {
		background-color: #e9e9e9;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-color: #e0e0e0;
		font-weight: bold;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.toggle-icon {
		font-size: 0.8rem;
		color: #555;
	}

	.section-content {
		padding: 1rem;
	}

	.options-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.empty-message {
		padding: 1rem;
		text-align: center;
		color: #666;
		font-style: italic;
	}

	@media (max-width: 600px) {
		.options-grid {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		}
	}
</style>
