<script lang="ts">
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import SequenceWorkbench from '../SequenceWorkbench/SequenceWorkbench.svelte';
	import OptionPicker from '../OptionPicker/OptionPicker.svelte';
	import SnowfallBackground from '../Backgrounds/SnowfallBackground.svelte';
	import SettingsDialog from '../SettingsDialog/SettingsDialog.svelte';
	import FullScreen from '$lib/FullScreen.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { loadPictographData } from '$lib/stores/pictographDataStore.js';
	import { selectedStartPos } from '$lib/stores/constructStores.js';
	import StartPosPicker from '../StartPosPicker/StartPosPicker.svelte';

	let dynamicHeight = '100vh';
	let isSettingsDialogOpen = false;
	let isFullScreen = false;
	let background = 'Snowfall';
	let isLoading = true;
	let pictographData: any;

	onMount(() => {
		loadPictographData()
			.then((data) => {
				pictographData = data;
				isLoading = false;
			})
			.catch((err) => {
				console.error('Error loading pictograph data:', err);
				isLoading = false;
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

	function handleFullscreenToggle(e: CustomEvent<boolean>) {
		isFullScreen = e.detail;
	}
</script>

<div id="main-widget">
	<!-- Render background immediately -->

	<FullScreen on:toggleFullscreen={handleFullscreenToggle}>
		<div class="background">
			<SnowfallBackground />
		</div>
		<div id="content">
			{#if isLoading}
				<!-- Display loading spinner as an overlay -->
				<div class="loading-overlay">
					<LoadingSpinner />
				</div>
			{:else}
				<div class="menuBar">
					<MenuBar
						{background}
						on:settingsClick={handleSettingsClick}
						on:changeBackground={(e) => updateBackground(e.detail)}
					/>
				</div>

				<div class="mainContent">
					<div class="sequenceWorkbenchContainer">
						<SequenceWorkbench />
					</div>

					<div class="optionPickerContainer">
						{#if $selectedStartPos}
							<OptionPicker />
						{:else}
							<StartPosPicker />
						{/if}
					</div>
				</div>
			{/if}

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
		height: var(--dynamicHeight, 100vh);
		display: flex;
		flex-direction: column;
		position: relative;
		background: linear-gradient(to bottom, #0b1d2a, #325078, #49708a);
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

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.4); /* Semi-transparent background */
		z-index: 10;
	}

	#content {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		z-index: 5;
	}

	.menuBar {
		flex: 0 0 auto;
		z-index: 1;
	}

	.mainContent {
		display: flex;
		overflow: auto;
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
		}
		.optionPickerContainer {
			flex: 1;
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
