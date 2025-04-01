<script lang="ts">
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import SequenceWorkbench from '../SequenceWorkbench/Workbench.svelte';
	import OptionPicker from '../OptionPicker/OptionPicker.svelte';
	import SnowfallBackground from '../SnowfallBackground.svelte';
	import SettingsDialog from '../SettingsDialog/SettingsDialog.svelte';
	import FullScreen from '$lib/FullScreen.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';
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
	let previousTab = 0;
	let contentVisible = true;

	// Track our transitions and timeouts
	let currentTab = 0;
	let displayedTab = 0;
	let currentTransitionTimeouts: number[] = []; // Store all timeout IDs
	
	// Component for each tab - needed to define this!
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

	// Animation direction - true = right to left, false = left to right
	$: slideDirection = currentTab > previousTab;

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

	// Clear all currently running transition timeouts
	function clearAllTransitions() {
		// Clear all timeouts
		for (const timeoutId of currentTransitionTimeouts) {
			clearTimeout(timeoutId);
		}
		// Reset the array
		currentTransitionTimeouts = [];
	}

	// Enhanced handler for tab changes with interrupt support
	function handleTabChange(e: CustomEvent<number>) {
		const newTabIndex = e.detail;

		// Skip if we're already on this tab
		if (newTabIndex === currentTab) return;

		// If we're in the middle of a transition, interrupt it
		clearAllTransitions();

		// Setup animation state
		previousTab = currentTab;
		currentTab = newTabIndex;

		// STEP 1: Fade out current content immediately
		contentVisible = false;

		// STEP 2: Create flash transition effect
		const timeoutId1 = setTimeout(() => {
			createPageTransition();

			// STEP 3: After fade out, update the displayed tab
			const timeoutId2 = setTimeout(() => {
				displayedTab = currentTab; // NOW we change what's displayed

				// STEP 4: A little delay before showing the new content
				const timeoutId3 = setTimeout(() => {
					contentVisible = true; // Fade in the new content
				}, 100);

				// Track this timeout
				currentTransitionTimeouts.push(timeoutId3 as unknown as number);
			}, 300); // Matches our fade-out duration

			// Track this timeout
			currentTransitionTimeouts.push(timeoutId2 as unknown as number);
		}, 50);

		// Track this timeout
		currentTransitionTimeouts.push(timeoutId1 as unknown as number);
	}

	// Create cool page transition effect
	function createPageTransition() {
		// Create flash element
		const flash = document.createElement('div');
		flash.className = 'page-transition-flash';
		flash.style.animationName = slideDirection ? 'flash-right' : 'flash-left';

		// Add to DOM and set up auto-removal
		document.getElementById('main-widget')?.appendChild(flash);

		// Store timeout for removal
		const timeoutId = setTimeout(() => flash.remove(), 700);
		currentTransitionTimeouts.push(timeoutId as unknown as number);
	}

	// Function to determine which animation to use based on tab index
	function getTransitionProps(tabIndex: number) {
		// Different animations for different tabs
		const transitions = [
			{ fn: slide, props: { duration: 500, easing: quintOut, x: slideDirection ? 100 : -100 } },
			{ fn: scale, props: { duration: 500, easing: elasticOut, start: 0.8, opacity: 0.2 } },
			{
				fn: fly,
				props: {
					duration: 600,
					x: slideDirection ? 100 : -100,
					y: slideDirection ? -50 : 50,
					opacity: 0.2
				}
			},
			{ fn: fade, props: { duration: 400, delay: 100 } },
			{ fn: slide, props: { duration: 500, easing: quintOut, y: slideDirection ? 100 : -100 } }
		];

		return transitions[tabIndex % transitions.length];
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

				<div class="mainContent" class:hidden={!contentVisible}>
					<!-- Critical fix: Using displayedTab instead of currentTab -->
					{#key displayedTab}
						{#if tabComponents[displayedTab].renderWithSplit}
							<div
								class="sequenceWorkbenchContainer"
								in:fly={{ duration: 500, x: slideDirection ? 100 : -100 }}
								out:fly={{ duration: 400, x: slideDirection ? -100 : 100 }}
							>
								<SequenceWorkbench />
							</div>

							<div
								class="optionPickerContainer"
								in:fly={{ duration: 500, delay: 200, x: slideDirection ? 100 : -100 }}
								out:fly={{ duration: 400, x: slideDirection ? -100 : 100 }}
							>
								{#if $selectedStartPos}
									<OptionPicker />
								{:else}
									<StartPosPicker />
								{/if}
							</div>
						{:else if tabComponents[displayedTab].component}
							<div
								in:getTransitionProps(displayedTab).fn={getTransitionProps(displayedTab).props}
								out:fade={{ duration: 300 }}
							>
								<svelte:component this={tabComponents[displayedTab].component} />
							</div>
						{:else}
							<div
								class="placeholder-content"
								in:getTransitionProps(displayedTab).fn={getTransitionProps(displayedTab).props}
								out:fade={{ duration: 300 }}
							>
								<div class="placeholder-card">
									<div class="placeholder-icon">
										{#if displayedTab === 1}
											<div in:scale={{ duration: 400, delay: 200 }} class="emoji-glow">🤖</div>
										{:else if displayedTab === 2}
											<div in:scale={{ duration: 400, delay: 200 }} class="emoji-glow">🔍</div>
										{:else if displayedTab === 3}
											<div in:scale={{ duration: 400, delay: 200 }} class="emoji-glow">🧠</div>
										{:else if displayedTab === 4}
											<div in:scale={{ duration: 400, delay: 200 }} class="emoji-glow">✍️</div>
										{/if}
									</div>
									<h2 in:fly={{ duration: 300, delay: 100, y: 20 }} class="placeholder-title">
										{#if displayedTab === 1}
											Generate
										{:else if displayedTab === 2}
											Browse
										{:else if displayedTab === 3}
											Learn
										{:else if displayedTab === 4}
											Write
										{/if}
									</h2>
									<p in:fade={{ duration: 300, delay: 300 }} class="placeholder-text">
										This feature is under development and will be available soon.
									</p>
									<div
										class="placeholder-progress"
										in:scale={{ duration: 400, delay: 400, start: 0.8 }}
									>
										<div class="progress-bar">
											<div class="progress-fill"></div>
										</div>
										<p class="progress-text">Coming Soon</p>
									</div>

									<div class="coming-soon-dots">
										<span></span>
										<span></span>
										<span></span>
									</div>
								</div>
							</div>
						{/if}
					{/key}
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
		overflow: hidden; /* Changed from auto to hidden to prevent animations from causing scrollbars */
		position: relative;
		z-index: 0;
		width: 100%;
		opacity: 1;
		transition: opacity 0.3s ease;
	}

	.mainContent.hidden {
		opacity: 0;
	}

	.background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
	}

	#content {
		display: flex;
		flex-direction: column;
		flex: 1; /* Force it to fill available space */
		min-height: 0; /* Prevents overflow */
	}

	/* In MainWidget.svelte */
	#main-widget {
		display: flex;
		flex-direction: column;
		flex: 1;
		height: 100%; /* Instead of min-height: 100vh */
		position: relative;
		background: linear-gradient(to bottom, #0b1d2a, #325078, #49708a);
		color: light-dark(black, white);
		overflow: hidden; /* Prevent any content from overflowing */
	}


	@keyframes flash-right {
		0% {
			transform: translateX(-100%);
			opacity: 0.7;
		}
		100% {
			transform: translateX(100%);
			opacity: 0;
		}
	}

	@keyframes flash-left {
		0% {
			transform: translateX(100%);
			opacity: 0.7;
		}
		100% {
			transform: translateX(-100%);
			opacity: 0;
		}
	}

	/* Enhanced placeholder styling */
	.placeholder-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		padding: 20px;
		perspective: 1000px; /* Add perspective for 3D animations */
	}

	.placeholder-card {
		background: rgba(30, 40, 60, 0.6);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		padding: 40px;
		text-align: center;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		max-width: 400px;
		width: 100%;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.placeholder-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
	}

	.placeholder-icon {
		font-size: 4rem;
		margin-bottom: 20px;
	}

	.placeholder-title {
		font-size: 2rem;
		margin: 0 0 15px 0;
		color: white;
	}

	.placeholder-text {
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 30px;
		font-size: 1.1rem;
	}

	.placeholder-progress {
		width: 100%;
	}

	.progress-bar {
		height: 8px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #6c9ce9, #1e3c72);
		border-radius: 4px;
		width: 0%;
		animation: loading 2s ease-in-out infinite alternate;
	}

	@keyframes loading {
		0% {
			width: 15%;
		}
		100% {
			width: 85%;
		}
	}

	.progress-text {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
	}

	/* Animated emoji glow effect */
	.emoji-glow {
		animation: pulse 2s infinite ease-in-out;
		filter: drop-shadow(0 0 10px rgba(108, 156, 233, 0.8));
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.9;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Coming soon dots animation */
	.coming-soon-dots {
		margin-top: 20px;
		display: flex;
		justify-content: center;
		gap: 10px;
	}

	.coming-soon-dots span {
		width: 8px;
		height: 8px;
		background-color: #fff;
		border-radius: 50%;
		display: inline-block;
		opacity: 0.6;
	}

	.coming-soon-dots span:nth-child(1) {
		animation: blink 1.4s infinite 0.2s;
	}

	.coming-soon-dots span:nth-child(2) {
		animation: blink 1.4s infinite 0.4s;
	}

	.coming-soon-dots span:nth-child(3) {
		animation: blink 1.4s infinite 0.6s;
	}

	@keyframes blink {
		0% {
			transform: scale(1);
			opacity: 0.4;
		}
		20% {
			transform: scale(1.3);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 0.4;
		}
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