<script>
	import { writable } from 'svelte/store';
	import MenuBar from './components/MenuBar.svelte';
	import SequenceWidget from './components/SequenceWidget.svelte';
	import OptionPicker from './components/OptionPicker.svelte';
	import SnowfallBackground from './components/SnowfallBackground.svelte';

	let background = writable('Snowfall');
</script>

<div id="app">
	<!-- Background -->
	<div class="background">
		<SnowfallBackground bind:background />
	</div>

	<!-- MenuBar -->
	<div class="menuBar">
		<MenuBar bind:background />
	</div>

	<!-- Main Content -->
	<div class="mainContent">
		<!-- SequenceWidget -->
		<div class="sequenceWidgetContainer">
			<SequenceWidget />
		</div>

		<!-- OptionPicker -->
		<div class="optionPickerContainer">
			<OptionPicker />
		</div>
	</div>
</div>

<style>
	#app {
		display: flex;
		flex-direction: column;
		height: 100vh; /* Full viewport height */
		width: 100vw; /* Full viewport width */
		position: relative; /* Ensure background positioning works */
	}

	.background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0; /* Lower z-index for the background */
	}

	.menuBar {
		flex: 0 0 auto; /* Fixed height for the menu bar */
		z-index: 1; /* Stays above other content */
	}

	.mainContent {
		flex: 1; /* Fills the remaining height */
		display: flex; /* Horizontal layout */
		flex-direction: row; /* SequenceWidget and OptionPicker side by side */
		overflow: hidden; /* Prevent content overflow */
		position: relative; /* Ensure content positioning works */
		z-index: 1; /* Stays above the background */
	}

	.sequenceWidgetContainer {
		flex: 1; /* Allocate more space to SequenceWidget */
		overflow: hidden; /* Avoid scrollbars */
	}

	.optionPickerContainer {
		flex: 1; /* Allocate smaller space to OptionPicker */
		overflow-y: auto; /* Enable vertical scrolling */
	}
</style>
