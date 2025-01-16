<script lang="ts">
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import SequenceWidget from '../SequenceWorkbench/SequenceWorkbench.svelte';
	import StartPosPicker from '../StartPosPicker/StartPosPicker.svelte';
	import OptionPicker from '../OptionPicker/OptionPicker.svelte';
	import SnowfallBackground from '../Backgrounds/SnowfallBackground.svelte';
	import SettingsDialog from '../SettingsDialog/SettingsDialog.svelte';

	import { writable } from 'svelte/store';
	import { selectedStartPos } from '../../stores/constructStores';
	import { loadPictographData } from '$lib/stores/pictographDataStore';

	import { onMount } from 'svelte';

	onMount(() => {
		loadPictographData(); // Initialize pictograph data
	});

	// State management
	let isSettingsDialogOpen = false;
	let background = 'Snowfall';
	const backgroundStore = writable('Snowfall');
	backgroundStore.subscribe((value) => (background = value));

	const updateBackground = (newBackground: string) => {
		backgroundStore.set(newBackground);
	};

	const handleSettingsClick = () => {
		isSettingsDialogOpen = true;
	};

	const handleTabChange = (e: CustomEvent<number>) => {
		const index = e.detail;
		console.log(`Tab changed to index: ${index}`);
	};
</script>

<div id="main-widget">
	<div class="background">
		<SnowfallBackground />
	</div>

	<div class="menuBar">
		<MenuBar
			{background}
			on:tabChange={handleTabChange}
			on:settingsClick={handleSettingsClick}
			on:changeBackground={(e) => updateBackground(e.detail)}
		/>
	</div>

	<div class="mainContent">
		<div class="sequenceWorkbenchContainer">
			<SequenceWidget />
		</div>

		<div class="optionPickerContainer">
			{#if $selectedStartPos}
				<OptionPicker />
			{:else}
				<StartPosPicker />
			{/if}
		</div>
	</div>

	<!-- Settings Dialog -->
	{#if isSettingsDialogOpen}
		<SettingsDialog
			isOpen={isSettingsDialogOpen}
			{background}
			onChangeBackground={updateBackground}
			onClose={() => (isSettingsDialogOpen = false)}
		/>
	{/if}
</div>

<style>
	#main-widget {
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
		color: light-dark(black, white);
	}

	.background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.menuBar {
		flex: 0 0 auto;   /* or simply "flex: none;" */

		z-index: 1;
	}

	.mainContent {
		flex: 1;
		display: flex;
		overflow: hidden;
		position: relative;
		z-index: 0;
		height: 100%;
		width: 100%;
	}

	.sequenceWorkbenchContainer,
	.optionPickerContainer {
		flex: 1;
	}

	@media (orientation: portrait) {
		.mainContent {
			flex-direction: column;
		}
		.sequenceWorkbenchContainer,
		.optionPickerContainer {
			height: 50%;
			width: 100%;
		}
	}

	@media (orientation: landscape) {
		.mainContent {
			flex-direction: row;
		}
		.sequenceWorkbenchContainer,
		.optionPickerContainer {
			height: 100%;
			width: 50%;
		}
	}
</style>
