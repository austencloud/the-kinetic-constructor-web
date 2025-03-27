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
	let loadingProgress = 0;
	let loadingText = 'Initializing...';
	let pictographData: any;

	onMount(() => {
		// Show loading spinner with progress simulation
		const loadingInterval = setInterval(() => {
			loadingProgress += 5;
			
			if (loadingProgress <= 30) {
				loadingText = "Loading components...";
			} else if (loadingProgress <= 60) {
				loadingText = "Processing pictograph data...";
			} else if (loadingProgress <= 90) {
				loadingText = "Preparing visualizations...";
			} else {
				loadingText = "Almost ready...";
			}
			
			if (loadingProgress >= 100) {
				clearInterval(loadingInterval);
			}
		}, 100);
		
		loadPictographData()
			.then((data) => {
				pictographData = data;
				setTimeout(() => {
					isLoading = false;
				}, 500); // Give a little extra time for final UI preparations
				clearInterval(loadingInterval); // Clear interval if data loads before progress reaches 100
			})
			.catch((err) => {
				console.error('Error loading pictograph data:', err);
				loadingText = "Error loading data. Please try refreshing.";
				setTimeout(() => {
					isLoading = false;
				}, 1000);
				clearInterval(loadingInterval);
			});

		function updateHeight() {
			dynamicHeight = `${window.innerHeight}px`;
		}

		window.addEventListener('resize', updateHeight);
		updateHeight();

		return () => {
			window.removeEventListener('resize', updateHeight);
			clearInterval(loadingInterval);
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
	<!-- Background is always loaded immediately to give a nice visual during loading -->
	<FullScreen on:toggleFullscreen={handleFullscreenToggle}>
		<div class="background">
			<SnowfallBackground />
		</div>
		
		{#if isLoading}
			<!-- Enhanced loading spinner with progress and text -->
			<div class="loading-overlay">
				<div class="loading-container">
					<LoadingSpinner />
					<div class="loading-progress-container">
						<div class="loading-progress-bar">
							<div class="loading-progress-fill" style="width: {loadingProgress}%"></div>
						</div>
						<p class="loading-text">{loadingText}</p>
					</div>
				</div>
			</div>
		{:else}
			<div id="content">
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
				
				{#if isSettingsDialogOpen}
					<SettingsDialog
						isOpen={isSettingsDialogOpen}
						{background}
						onChangeBackground={updateBackground}
						onClose={() => (isSettingsDialogOpen = false)}
					/>
				{/if}
			</div>
		{/if}
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
		background-color: rgba(0, 0, 0, 0.4);
		z-index: 10;
	}
	
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.95);
		padding: 30px;
		border-radius: 10px;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
		max-width: 80%;
	}
	
	.loading-progress-container {
		margin-top: 20px;
		width: 100%;
		text-align: center;
	}
	
	.loading-progress-bar {
		width: 300px;
		height: 10px;
		background-color: #e0e0e0;
		border-radius: 5px;
		overflow: hidden;
		margin: 10px 0;
	}
	
	.loading-progress-fill {
		height: 100%;
		background-color: #4285f4;
		border-radius: 5px;
		transition: width 0.3s ease;
	}
	
	.loading-text {
		font-size: 16px;
		color: #333;
		margin: 0;
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