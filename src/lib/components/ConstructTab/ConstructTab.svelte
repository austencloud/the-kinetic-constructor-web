<script lang="ts">
	import { derived } from 'svelte/store';
	import { fade, crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import OptionPicker from './OptionPicker/OptionPicker.svelte';
	import StartPosPicker from './StartPosPicker/StartPosPicker.svelte';
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';

	// Derived store to determine which picker to show
	const isEmpty = derived(isSequenceEmpty, ($isEmpty) => $isEmpty);

	// Create crossfade transition
	const [send, receive] = crossfade({
		duration: 300,
		easing: cubicOut,
		fallback(node, _params) {
			return fade(node, {
				duration: 300,
				easing: cubicOut
			});
		}
	});
</script>

<div class="construct-tab">
	<div class="sequenceWorkbenchContainer">
		<SequenceWorkbench />
	</div>
	<div class="optionPickerContainer">
		{#if $isEmpty}
			<div class="picker-container" in:receive={{ key: 'startpos' }} out:send={{ key: 'startpos' }}>
				<StartPosPicker />
			</div>
		{:else}
			<div class="picker-container" in:receive={{ key: 'options' }} out:send={{ key: 'options' }}>
				<OptionPicker />
			</div>
		{/if}
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
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
	}

	.optionPickerContainer {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.picker-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
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
