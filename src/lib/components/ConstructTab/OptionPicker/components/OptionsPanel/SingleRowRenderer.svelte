<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import SectionHeader from '../SectionHeader.svelte';
	import OptionGroupGrid from '../OptionGroupGrid.svelte';

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		optionSelect: PictographData;
	}>();

	// Props
	export let groups: Array<{ key: string; options: PictographData[] }>;
	export let transitionKey: string | number;
	export let rowIndex: number;

	// Handle option selection events from OptionGroupGrid
	function handleOptionSelect(event: CustomEvent<PictographData>) {
		// Forward the event to parent components
		dispatch('optionSelect', event.detail);
	}
</script>

{#each groups as group (transitionKey + '-group-' + group.key)}
	<SectionHeader groupKey={group.key} isFirstHeader={rowIndex === 0} />
	<OptionGroupGrid 
		options={group.options} 
		key={transitionKey + '-optgroup-' + group.key} 
		on:optionSelect={handleOptionSelect}
	/>
{/each}
