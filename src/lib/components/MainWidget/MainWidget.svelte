<script lang="ts">
	import { writable, derived } from 'svelte/store';
	import { onMount } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';
	
	// Components
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import SequenceWorkbench from '../SequenceWorkbench/Workbench.svelte';
	import OptionPicker from '../OptionPicker/OptionPicker.svelte';
	import SnowfallBackground from '../SnowfallBackground.svelte';
	import SettingsDialog from '../SettingsDialog/SettingsDialog.svelte';
	import FullScreen from '$lib/FullScreen.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import StartPosPicker from '../StartPosPicker/StartPosPicker.svelte';
	
	// Stores
	import { selectedStartPos } from '$lib/stores/constructStores';
	import { loadingState } from '$lib/stores/loadingStateStore';
	
	// Utils
	import { initializeApplication } from '$lib/utils/appInitializer';

	// ===== Application State =====
	const appState = writable({
		isSettingsDialogOpen: false,
		isFullScreen: false,
		background: 'Snowfall',
		initializationError: false,
		currentTab: 0,
		previousTab: 0,
		contentVisible: true,
		dynamicHeight: '100vh'
	});

	// Tab definitions - using a more declarative approach
	const tabs = [
		{
			id: 'sequence',
			component: SequenceWorkbench,
			icon: '🧬',
			title: 'Sequence',
			splitView: true
		},
		{
			id: 'generate',
			component: null,
			icon: '🤖',
			title: 'Generate',
			splitView: false
		},
		{
			id: 'browse',
			component: null,
			icon: '🔍',
			title: 'Browse',
			splitView: false
		},
		{
			id: 'learn',
			component: null, 
			icon: '🧠',
			title: 'Learn',
			splitView: false
		},
		{
			id: 'write',
			component: null,
			icon: '✍️',
			title: 'Write',
			splitView: false
		}
	];

	// ===== Derived State =====
	// Create derived stores for specific pieces of state
	const activeTab = derived(appState, $state => tabs[$state.currentTab]);
	const slideDirection = derived(appState, $state => $state.currentTab > $state.previousTab);
	
	// ===== Lifecycle =====
	onMount(() => {
		// Initialize the application
		initializeApplication().then(success => {
			if (!success) {
				appState.update(state => ({ ...state, initializationError: true }));
			}
		});

		// Set up window resize handling
		const updateHeight = () => {
			appState.update(state => ({ ...state, dynamicHeight: `${window.innerHeight}px` }));
		};

		window.addEventListener('resize', updateHeight);
		updateHeight();

		return () => {
			window.removeEventListener('resize', updateHeight);
		};
	});

	// ===== Event Handlers =====
	const handleSettingsClick = () => {
		appState.update(state => ({ ...state, isSettingsDialogOpen: true }));
	};

	const handleFullscreenToggle = (e: CustomEvent<boolean>) => {
		appState.update(state => ({ ...state, isFullScreen: e.detail }));
	};

	const handleTabChange = (e: CustomEvent<number>) => {
		const newTabIndex = e.detail;
		
		appState.update(state => {
			// Skip if we're already on this tab
			if (newTabIndex === state.currentTab) return state;
			
			return { 
				...state, 
				previousTab: state.currentTab,
				currentTab: newTabIndex,
				// Immediately hide content for transition
				contentVisible: false
			};
		});
		
		// Use a simple timeout to show content after a brief delay
		// This provides a cleaner, more declarative approach than multiple nested timeouts
		setTimeout(() => {
			appState.update(state => ({ ...state, contentVisible: true }));
		}, 300);
	};

	const updateBackground = (newBackground: string) => {
		appState.update(state => ({ ...state, background: newBackground }));
	};

	const closeSettingsDialog = () => {
		appState.update(state => ({ ...state, isSettingsDialogOpen: false }));
	};
	
	// ===== Transition Helpers =====
	// Pure function to determine transition properties based on tab index
	const getTransitionProps = (tabIndex: number, isSlideRight: boolean) => {
		const transitions = [
			{ 
				fn: slide, 
				props: { 
					duration: 500, 
					easing: quintOut, 
					x: isSlideRight ? 100 : -100 
				} 
			},
			{ 
				fn: scale, 
				props: { 
					duration: 500, 
					easing: elasticOut, 
					start: 0.8, 
					opacity: 0.2 
				} 
			},
			{
				fn: fly,
				props: {
					duration: 600,
					x: isSlideRight ? 100 : -100,
					y: isSlideRight ? -50 : 50,
					opacity: 0.2
				}
			},
			{ 
				fn: fade, 
				props: { 
					duration: 400, 
					delay: 100 
				} 
			},
			{ 
				fn: slide, 
				props: { 
					duration: 500, 
					easing: quintOut, 
					y: isSlideRight ? 100 : -100 
				} 
			}
		];

		return transitions[tabIndex % transitions.length];
	};
</script>

<div 
	id="main-widget" 
	style="height: {$appState.dynamicHeight}"
>
	<FullScreen on:toggleFullscreen={handleFullscreenToggle}>
		<!-- Background always loads first for visual appeal -->
		<div class="background">
			<SnowfallBackground />
		</div>

		{#if $loadingState.isLoading}
			<!-- Loading state -->
			<div class="loading-overlay">
				<div class="loading-container">
					<LoadingSpinner />
					<div class="loading-progress-container">
						<div class="loading-progress-bar">
							<div 
								class="loading-progress-fill" 
								style="width: {$loadingState.progress}%"
							></div>
						</div>
						<p class="loading-text">{$loadingState.message}</p>

						{#if $appState.initializationError}
							<p class="error-text">
								An error occurred during initialization.
								<button 
									class="retry-button" 
									on:click={() => window.location.reload()}
								>
									Retry
								</button>
							</p>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div id="content">
				<!-- Menu Bar -->
				<div class="menuBar">
					<MenuBar
						background={$appState.background}
						on:settingsClick={handleSettingsClick}
						on:changeBackground={(e) => updateBackground(e.detail)}
						on:tabChange={handleTabChange}
					/>
				</div>

				<!-- Main Content Area -->
				<div 
					class="mainContent" 
					class:hidden={!$appState.contentVisible}
				>
					<!-- Use key to force re-render on tab change -->
					{#key $appState.currentTab}
						{#if $activeTab.splitView}
							<!-- Split view layout for sequence workbench -->
							<div
								class="sequenceWorkbenchContainer"
								in:fly={{ 
									duration: 500, 
									x: $slideDirection ? 100 : -100 
								}}
								out:fly={{ 
									duration: 400, 
									x: $slideDirection ? -100 : 100 
								}}
							>
								<SequenceWorkbench />
							</div>

							<div
								class="optionPickerContainer"
								in:fly={{ 
									duration: 500, 
									delay: 200, 
									x: $slideDirection ? 100 : -100 
								}}
								out:fly={{ 
									duration: 400, 
									x: $slideDirection ? -100 : 100 
								}}
							>
								{#if $selectedStartPos}
									<OptionPicker />
								{:else}
									<StartPosPicker />
								{/if}
							</div>
						{:else if $activeTab.component}
							<!-- Full view for components that don't need split view -->
							<div
								in:fly={{ 
									duration: 500, 
									x: $slideDirection ? 100 : -100,
									opacity: 0.2
								}}
								out:fade={{ duration: 300 }}
							>
								<svelte:component this={$activeTab.component} />
							</div>
						{:else}
							<!-- Placeholder for features under development -->
							<div
								class="placeholder-content"
								in:fly={{ 
									duration: 500, 
									x: $slideDirection ? 100 : -100,
									opacity: 0.2
								}}
								out:fade={{ duration: 300 }}
							>
								<div class="placeholder-card">
									<div class="placeholder-icon">
										<div 
											in:scale={{ duration: 400, delay: 200 }} 
											class="emoji-glow"
										>
											{$activeTab.icon}
										</div>
									</div>
									<h2 
										in:fly={{ duration: 300, delay: 100, y: 20 }} 
										class="placeholder-title"
									>
										{$activeTab.title}
									</h2>
									<p 
										in:fade={{ duration: 300, delay: 300 }} 
										class="placeholder-text"
									>
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

				<!-- Settings Dialog -->
				{#if $appState.isSettingsDialogOpen}
					<SettingsDialog
						isOpen={$appState.isSettingsDialogOpen}
						background={$appState.background}
						onChangeBackground={updateBackground}
						onClose={closeSettingsDialog}
					/>
				{/if}
			</div>
		{/if}
	</FullScreen>
</div>

<style>
	/* Loading overlay styling */
	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
		background: rgba(11, 29, 42, 0.9);
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		padding: 30px;
		border-radius: 12px;
		background: rgba(30, 40, 60, 0.7);
		backdrop-filter: blur(5px);
		max-width: 400px;
		width: 100%;
	}

	.loading-progress-container {
		width: 100%;
		text-align: center;
	}

	.loading-progress-bar {
		width: 100%;
		height: 10px;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 5px;
		overflow: hidden;
		margin-bottom: 10px;
	}

	.loading-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #6c9ce9, #1e3c72);
		border-radius: 5px;
		transition: width 0.3s ease;
	}

	.loading-text {
		font-size: 16px;
		color: white;
		margin: 0;
	}

	.error-text {
		color: #ff6b6b;
		margin-top: 10px;
	}

	.retry-button {
		margin-left: 10px;
		padding: 5px 15px;
		background: #3a7bd5;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background 0.2s;
	}

	.retry-button:hover {
		background: #2a5298;
	}

	.mainContent {
		display: flex;
		flex: 1;
		overflow: hidden;
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
		flex: 1;
		min-height: 0;
	}

	#main-widget {
		display: flex;
		flex-direction: column;
		flex: 1;
		position: relative;
		background: linear-gradient(to bottom, #0b1d2a, #325078, #49708a);
		color: light-dark(black, white);
		overflow: hidden;
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
		perspective: 1000px;
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

	/* Responsive layouts */
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