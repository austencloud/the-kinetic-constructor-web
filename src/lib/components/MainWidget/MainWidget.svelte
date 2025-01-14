<script lang="ts">
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import SequenceWidget from '../SequenceWidget/SequenceWidget.svelte';
	import OptionPicker from '../OptionPicker/OptionPicker.svelte';
	import SnowfallBackground from '../Backgrounds/SnowfallBackground.svelte';
	import SettingsDialog from '../SettingsDialog/SettingsDialog.svelte';
	import { writable } from 'svelte/store';

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

<div id="app">
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
		<div class="sequenceWidgetContainer">
			<SequenceWidget />
		</div>

		<div class="optionPickerContainer">
			<OptionPicker options={[{ name: 'Option1', pictographData: null }, { name: 'Option2', pictographData: null }]} />
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
	#app {
		height: 100%;
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		position: relative;
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
		flex: 0 0 auto;
		z-index: 1;
	}

	.mainContent {
		flex: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
		position: relative;
		z-index: 0;
		height: 100%;
		width: 100%;
	}

	.sequenceWidgetContainer {
		flex: 1;
	}

	.optionPickerContainer {
		flex: 1;
	}
</style>
