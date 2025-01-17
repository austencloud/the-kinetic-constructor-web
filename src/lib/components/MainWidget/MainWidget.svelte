<script lang="ts">
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import SequenceWidget from '../SequenceWorkbench/SequenceWorkbench.svelte';
	import StartPosPicker from '../StartPosPicker/StartPosPicker.svelte';
	import OptionPicker from '../OptionPicker/OptionPicker.svelte';
	import SnowfallBackground from '../Backgrounds/SnowfallBackground.svelte';
	import SettingsDialog from '../SettingsDialog/SettingsDialog.svelte';
	import FullScreen from '$lib/FullScreen.svelte';
	import { writable } from 'svelte/store';
	import { selectedStartPos } from '../../stores/constructStores';
	import { loadPictographData } from '$lib/stores/pictographDataStore';
	import { onMount } from 'svelte';

	// State management
	let dynamicHeight = '100vh';
	let isSettingsDialogOpen = false;
	let isFullScreen = false;
	let background = 'Snowfall';

	// Placeholder for pictograph data
	let pictographData: any;

	onMount(() => {
		loadPictographData()
			.then((data) => {
				pictographData = data;
				console.log('Loaded Pictograph Data:', pictographData); // Debug output
			})
			.catch((err) => {
				console.error('Error loading pictograph data:', err);
			});

		function updateHeight() {
			dynamicHeight = `${window.innerHeight}px`;
		}

		window.addEventListener('resize', updateHeight);
		updateHeight();

		return () => {
			window.removeEventListener('resize', updateHeight);
		};
	});

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

	// Listen for fullscreen toggle
	function handleFullscreenToggle(e: CustomEvent<boolean>) {
		isFullScreen = e.detail;
	}
</script>

<div id="main-widget">
	<FullScreen on:toggleFullscreen={handleFullscreenToggle}>
		<div id="content-wrapper">
			<div class="background">
				<SnowfallBackground />
			</div>

			<div class="menuBar">
				<MenuBar
					{background}
					{isFullScreen}
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
	</FullScreen>
</div>

<style>
	#main-widget {
		height: var(--dynamicHeight, 100vh); /* Fallback to 100vh */
		display: flex;
		flex-direction: column;
		position: relative;
		color: light-dark(black, white);
	}
	#content-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
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
		flex: 0 0 auto; /* or simply "flex: none;" */
		z-index: 1;
	}

	.mainContent {
		display: flex;
		overflow: auto; /* Allow overflow */
		position: relative;
		z-index: 0;
		height: 100%;
		width: 100%;
	}

	@media (orientation: portrait) {
		.mainContent {
			flex-direction: column;
		}
		.sequenceWorkbenchContainer {
			flex: 2;
			/* height:75% */
		}
		.optionPickerContainer {
			flex: 1;
			/* height:25% */
		}
	}

	@media (orientation: landscape) {
		.mainContent {
			flex-direction: row;
		}
		.sequenceWorkbenchContainer {
			flex: 1;
			width: 50%;
		}
		.optionPickerContainer {
			flex: 1;
			width: 50%;
		}
	}
</style>
