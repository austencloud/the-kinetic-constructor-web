<script lang="ts">
	import { writable, derived, type Readable, get } from 'svelte/store';
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
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
	import { sequenceActions } from '$lib/stores/sequenceActions';
	import { beatsStore } from '$lib/stores/beatsStore';
	
	// Utils
	import { initializeApplication } from '$lib/utils/appInitializer';
	
	// ===== Types =====
	type TransitionConfig = {
		fn: typeof fade | typeof fly | typeof scale | typeof slide;
		props: Record<string, any>;
	};
	
	type Tab = {
		id: string;
		component: any; // Component constructor type
		icon: string;
		title: string;
		splitView: boolean;
	};
	
	// ===== State Types =====
	interface AppState {
		isSettingsDialogOpen: boolean;
		isFullScreen: boolean;
		background: string;
		initializationError: boolean;
		currentTab: number;
		previousTab: number;
		contentVisible: boolean;
		dynamicHeight: string;
		transitionInProgress: boolean;
	}
	
	// ===== Event Dispatch =====
	const dispatch = createEventDispatcher<{
		tabChange: { index: number; id: string };
		settingsChange: { background: string };
	}>();
	
	// ===== Application State =====
	const appState = writable<AppState>({
		isSettingsDialogOpen: false,
		isFullScreen: false,
		background: 'Snowfall',
		initializationError: false,
		currentTab: 0,
		previousTab: 0,
		contentVisible: true,
		dynamicHeight: '100vh',
		transitionInProgress: false
	});
	
	// ===== Tab Configuration =====
	// Pure definition of application tabs - aligned with NavWidget's expectations
	const tabs: ReadonlyArray<Tab> = [
		{
			id: 'construct',
			component: SequenceWorkbench,
			icon: '⚒️', // Match NavWidget
			title: 'Construct', // Match NavWidget
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
	] as const;
	
	// ===== Derived Stores =====
	// Extract active tab based on current state
	const activeTab: Readable<Tab> = derived(
		appState, 
		$state => tabs[$state.currentTab]
	);
	
	// Determine slide direction based on tab indexes
	const slideDirection: Readable<boolean> = derived(
		appState, 
		$state => $state.currentTab > $state.previousTab
	);
	
	// Compute whether sequence is empty for conditional UI
	const isSequenceEmpty = derived(
		beatsStore,
		$beats => $beats.length === 0
	);
	
	// Check if a tab transition is currently in progress
	const isTabTransitionInProgress = derived(
		appState,
		$state => $state.transitionInProgress
	);
	
	// ===== Action Creators =====
	// Pure functions for state updates
	const actions = {
		openSettings: () => {
			appState.update(state => ({ ...state, isSettingsDialogOpen: true }));
		},
		
		closeSettings: () => {
			appState.update(state => ({ ...state, isSettingsDialogOpen: false }));
		},
		
		updateBackground: (newBackground: string) => {
			appState.update(state => ({ ...state, background: newBackground }));
			dispatch('settingsChange', { background: newBackground });
		},
		
		setFullScreen: (isFullScreen: boolean) => {
			appState.update(state => ({ ...state, isFullScreen }));
		},
		
		setInitializationError: (hasError: boolean) => {
			appState.update(state => ({ ...state, initializationError: hasError }));
		},
		
		changeTab: (newTabIndex: number): Promise<void> => {
			return new Promise((resolve) => {
				// Check if a transition is already in progress to prevent overlapping animations
				const currentState = get(appState);
				
				// Skip if already on this tab or transition in progress
				if (newTabIndex === currentState.currentTab || currentState.transitionInProgress) {
					resolve();
					return;
				}
				
				// Update the state
				appState.update(s => ({
					...s,
					previousTab: s.currentTab,
					currentTab: newTabIndex,
					contentVisible: false,
					transitionInProgress: true
				}));
				
				// Dispatch event
				dispatch('tabChange', { 
					index: newTabIndex, 
					id: tabs[newTabIndex].id 
				});
				
				// Complete the transition after a delay
				setTimeout(() => {
					appState.update(s => ({ 
						...s, 
						contentVisible: true,
						transitionInProgress: false
					}));
					resolve();
				}, 300);
			});
		}
	};
	
	// ===== Lifecycle =====
	onMount(() => {
		// Initialize the application with functional approach
		const initApp = async () => {
			try {
				const success = await initializeApplication();
				if (!success) {
					actions.setInitializationError(true);
				}
			} catch (error) {
				console.error('Application initialization failed:', error);
				actions.setInitializationError(true);
			}
		};
		
		initApp();
		
		// Set up window resize handler with debounce
		let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
		
		const handleResize = () => {
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			
			resizeTimeout = setTimeout(() => {
				appState.update(state => ({ 
					...state, 
					dynamicHeight: `${window.innerHeight}px` 
				}));
			}, 100);
		};
		
		window.addEventListener('resize', handleResize);
		handleResize(); // Initial call
		
		// Cleanup function
		return () => {
			window.removeEventListener('resize', handleResize);
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
		};
	});
	
	// ===== Transition System =====
	// Pure function to map tab index to transition configuration
	const getTransitionProps = (tabIndex: number, isSlideRight: boolean): TransitionConfig => {
		const transitions: TransitionConfig[] = [
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
	
	// ===== Event Handlers =====
	const handleSettingsClick = () => actions.openSettings();
	
	const handleFullscreenToggle = (e: CustomEvent<boolean>) => 
		actions.setFullScreen(e.detail);
	
	// Updated to handle tab changes only when not in transition
	const handleTabChange = (e: CustomEvent<number>) => {
		actions.changeTab(e.detail);
	};
	
	const handleBackgroundChange = (e: CustomEvent<string>) => 
		actions.updateBackground(e.detail);
	
	const handleRetry = () => window.location.reload();
</script>

<div 
	id="main-widget" 
	style="height: {$appState.dynamicHeight}"
	class="main-widget"
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
									on:click={handleRetry}
								>
									Retry
								</button>
							</p>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="content">
				<!-- Menu Bar -->
				<div class="menuBar">
					<MenuBar
						background={$appState.background}
						on:settingsClick={handleSettingsClick}
						on:changeBackground={handleBackgroundChange}
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
								<!-- Conditionally show StartPosPicker or OptionPicker -->
								{#if $selectedStartPos}
									<OptionPicker />
								{:else}
									<StartPosPicker />
								{/if}
							</div>
						{:else if $activeTab.component}
							<!-- Full view for components that don't need split view -->
							<div
								class="fullViewComponent"
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
										<div in:scale={{ duration: 400, delay: 200 }} class="emoji-glow">
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
						onChangeBackground={actions.updateBackground}
						onClose={actions.closeSettings}
					/>
				{/if}
			</div>
		{/if}
	</FullScreen>
</div>

<style>
	/* Base layout */
	.main-widget {
		display: flex;
		flex-direction: column;
		flex: 1;
		position: relative;
		background: linear-gradient(to bottom, #0b1d2a, #325078, #49708a);
		color: light-dark(black, white);
		overflow: hidden;
	}
	
	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}
	
	.background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
	}
	
	/* Content layout */
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
	
	.fullViewComponent {
		width: 100%;
		height: 100%;
	}
	
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
	
	/* Placeholder styling */
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
		transition: transform 0.3s ease, box-shadow 0.3s ease;
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