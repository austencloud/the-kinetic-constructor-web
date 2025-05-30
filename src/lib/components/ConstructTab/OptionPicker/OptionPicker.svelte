<script lang="ts">
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	import StartPositionPicker from './components/StartPositionPicker.svelte';
	import OptionPickerMain from './components/OptionPickerMain.svelte';

	// DISABLED: Log sequence empty state - MAY BE CAUSING LOOPS
	// $effect(() => console.log('5️⃣ OptionPicker isEmpty state:', sequenceState.isEmpty));
</script>

<div class="option-picker">
	{#if sequenceState.isEmpty}
		<StartPositionPicker />
	{:else}
		<OptionPickerMain />
	{/if}
</div>

<style>
	.option-picker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
		background-color: transparent;
		justify-content: center;
	}
</style>
