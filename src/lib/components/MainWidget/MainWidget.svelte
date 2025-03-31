<script lang="ts">
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import SequenceWorkbench from '../SequenceWorkbench/Workbench.svelte';
	import OptionPicker from '../OptionPicker/OptionPicker.svelte';
	import SnowfallBackground from '../Backgrounds/SnowfallBackground.svelte';
	import SettingsDialog from '../SettingsDialog/SettingsDialog.svelte';
	import FullScreen from '$lib/FullScreen.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { selectedStartPos } from '$lib/stores/constructStores.js';
	import StartPosPicker from '../StartPosPicker/StartPosPicker.svelte';
	import { loadingState } from '$lib/stores/loadingStateStore';
	import { initializeApplication } from '$lib/utils/appInitializer';

	let dynamicHeight = '100vh';
	let isSettingsDialogOpen = false;
	let isFullScreen = false;
	let background = 'Snowfall';
	let pictographData: any;
	let initializationError = false;

	// Current tab state
	let currentTab = 0;

	// Component for each tab
	const tabComponents = [
		{
			component: SequenceWorkbench,
			renderWithSplit: true
		},
		{
			component: null, // Generate (placeholder)
			renderWithSplit: false
		},
		{
			component: null, // Browse (placeholder)
			renderWithSplit: false
		},
		{
			component: null, // Learn (placeholder)
			renderWithSplit: false
		},
		{
			component: null, // Write (placeholder)
			renderWithSplit: false
		}
	];

	onMount(() => {
		// Initialize the application using our centralized initializer
		initializeApplication().then((success) => {
			if (!success) {
				initializationError = true;
			}
		});

		// Set up window resize handling for height adjustment
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

	// Handler for tab changes
	function handleTabChange(e: CustomEvent<number>) {
		currentTab = e.detail;
	}
</script>

<div id="main-widget">
	<!-- Background is always loaded immediately to give a nice visual during loading -->
	<FullScreen on:toggleFullscreen={handleFullscreenToggle}>
		<div class="background">
			<SnowfallBackground />
		</div>

		{#if $loadingState.isLoading}
			<!-- Enhanced loading spinner with progress and text -->
			<div class="loading-overlay">
				<div class="loading-container">
					<LoadingSpinner />
					<div class="loading-progress-container">
						<div class="loading-progress-bar">
							<div class="loading-progress-fill" style="width: {$loadingState.progress}%"></div>
						</div>
						<p class="loading-text">{$loadingState.message}</p>

						{#if initializationError}
							<p class="error-text">
								An error occurred during initialization.
								<button class="retry-button" on:click={() => window.location.reload()}>
									Retry
								</button>
							</p>
						{/if}
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
						on:tabChange={handleTabChange}
					/>
				</div>

				<div class="mainContent">
					{#if tabComponents[currentTab].renderWithSplit}
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
					{:else if tabComponents[currentTab].component}
						<svelte:component this={tabComponents[currentTab].component} />
					{:else}
						<div class="placeholder-content">
							<h2>Coming Soon</h2>
							<p>This tab is under development.</p>
						</div>
					{/if}
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
	.mainContent {
		display: flex;
		flex: 1; /* This will make it fill remaining space */
		overflow: auto;
		position: relative;
		z-index: 0;
		width: 100%;
	}

	#content {
		display: flex;
		flex-direction: column;
		flex: 1; /* Force it to fill available space */
		min-height: 0; /* Prevents overflow */
	}

	#main-widget {
		display: flex;
		flex-direction: column;
		flex: 1; /* Ensure it fills the entire viewport */
		min-height: 100vh;
		position: relative;
		background: linear-gradient(to bottom, #0b1d2a, #325078, #49708a);
		color: light-dark(black, white);
	}

	.placeholder-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		padding: 20px;
		text-align: center;
		background-color: #f0f0f0;
		border-radius: 10px;
		margin: 0; /* Removed margin to prevent extra space */
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
