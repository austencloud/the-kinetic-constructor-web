<script lang="ts">
	import { derived } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import OptionPicker from './OptionPicker/OptionPicker.svelte';
	import StartPosPicker from './StartPosPicker/StartPosPicker.svelte';
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';

	// Derived store to determine which picker to show
	const isEmpty = derived(isSequenceEmpty, ($isEmpty) => $isEmpty);

	// Fade transition properties
	const pickerFadeProps = {
		duration: 300
	};
</script>

<div class="construct-tab">
	<div class="sequenceWorkbenchContainer">
		<SequenceWorkbench />
	</div>
	<div class="optionPickerContainer">
		{#key $isEmpty}
			<div class="picker-container" transition:fade={pickerFadeProps}>
				{#if $isEmpty}
					<StartPosPicker />
				{:else}
					<OptionPicker />
				{/if}
			</div>
		{/key}
	</div>
</div>

<style>
	.construct-tab {
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.sequenceWorkbenchContainer {
		flex: 3;
		min-width: 0;
		height: 100%;
		overflow: hidden;
	}

	.optionPickerContainer {
		flex: 2;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.picker-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.construct-tab {
			flex-direction: column;
		}

		.sequenceWorkbenchContainer {
			flex: 1;
			height: 50%;
		}

		.optionPickerContainer {
			flex: 1;
			height: 50%;
		}
	}
</style>
