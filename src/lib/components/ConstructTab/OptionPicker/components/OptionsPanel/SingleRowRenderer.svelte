<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import SectionHeader from '../SectionHeader.svelte';
	import OptionGroupGrid from '../OptionGroupGrid.svelte';

	const { groups, transitionKey, rowIndex, onoptionselect } = $props<{
		groups: Array<{ key: string; options: PictographData[] }>;
		transitionKey: string | number;
		rowIndex: number;
		onoptionselect?: (option: PictographData) => void;
	}>();
</script>

{#each groups as group (transitionKey + '-group-' + group.key)}
	<SectionHeader groupKey={group.key} isFirstHeader={rowIndex === 0} />
	<OptionGroupGrid
		options={group.options}
		key={transitionKey + '-optgroup-' + group.key}
		{onoptionselect}
	/>
{/each}
