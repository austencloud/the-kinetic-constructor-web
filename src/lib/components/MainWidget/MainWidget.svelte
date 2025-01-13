<script lang="ts">
	import { writable } from 'svelte/store';
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import SequenceWidget from '../SequenceWidget/SequenceWidget.svelte';
	import OptionPicker from '../OptionPicker/OptionPicker.svelte';
	import SnowfallBackground from '../Backgrounds/SnowfallBackground.svelte';

	export let backgroundStore = writable<string>('Snowfall');
	let background: string = 'Snowfall';
	$: backgroundStore.subscribe((value: string) => {
		background = value;
	});
	const updateBackground = (newBackground: string): void => {
		backgroundStore.set(newBackground);
	};
</script>

<div id="app">
	<div class="background">
		<SnowfallBackground />
	</div>

	<div class="menuBar">
		<MenuBar
			{background}
			onChangeBackground={(e: CustomEvent) => updateBackground(e.detail)}
			onTabChange={(e: CustomEvent) => {}}
		/>
	</div>

	<div class="mainContent">
		<div class="sequenceWidgetContainer">
			<SequenceWidget />
		</div>

		<div class="optionPickerContainer">
			<OptionPicker />
		</div>
	</div>
</div>

<style>
	#app {
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
		/* z-index: 1; */
	}

	.mainContent {
		flex: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
		position: relative;
		/* z-index: 1; */
	}

	.sequenceWidgetContainer {
		flex: 1;
		overflow: hidden;
	}

	.optionPickerContainer {
		flex: 1;
		overflow-y: auto;
	}
</style>
