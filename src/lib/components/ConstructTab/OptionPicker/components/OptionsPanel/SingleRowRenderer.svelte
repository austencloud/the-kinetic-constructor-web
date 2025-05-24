<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import SectionHeader from '../SectionHeader.svelte';
	import OptionGroupGrid from '../OptionGroupGrid.svelte';

	// Props
	const props = $props<{
		groups: Array<{ key: string; options: PictographData[] }>;
		transitionKey: string | number;
		rowIndex: number;
		onoptionselect?: (option: PictographData) => void;
	}>();

	// Handle option selection events from OptionGroupGrid
	function handleOptionSelect(option: PictographData) {
		// Call the callback if provided
		if (props.onoptionselect) {
			props.onoptionselect(option);
		}
	}
</script>

{#each props.groups as group (props.transitionKey + '-group-' + group.key)}
	<SectionHeader groupKey={group.key} isFirstHeader={props.rowIndex === 0} />
	<OptionGroupGrid
		options={group.options}
		key={props.transitionKey + '-optgroup-' + group.key}
		onoptionselect={handleOptionSelect}
	/>
{/each}
