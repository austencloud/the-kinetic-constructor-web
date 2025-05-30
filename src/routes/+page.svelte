<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	// import { untrack } from 'svelte'; // Not needed for this test

	// Components
	import FullScreen from '$lib/AppFullScreen.svelte';
	import MainLayout from '$lib/components/MainWidget/layout/MainLayout.svelte';
	import EnhancedLoadingOverlay from '$lib/components/MainWidget/loading/EnhancedLoadingOverlay.svelte';
	// import BackgroundCanvas from '$lib/components/Backgrounds/BackgroundCanvas.svelte'; // Disabled for testing
	import BackgroundProvider from '$lib/components/Backgrounds/BackgroundProvider.svelte';

	// State Management - MIGRATED TO PURE SVELTE 5 RUNES
	import { appState } from '$lib/state/simple/appState.svelte';
	import { uiStore } from '$lib/state/stores/uiStore';
	import type { BackgroundType } from '$lib/components/Backgrounds/types/types';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// 🧪 NUCLEAR TEST: Import sequence state for testing
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	import { getTestPictographsByLetters } from '$lib/utils/tests/pictographTestHelpers';
	import { Letter } from '$lib/types/Letter';

	// MIGRATED: Direct reactive access to pure Svelte 5 runes state
	const windowHeight = $derived(uiStore ? uiStore.windowHeight + 'px' : '100vh');

	// Already imported above

	const isInitializingApp = $derived(appState.isLoading);
	const hasFailed = $derived(appState.initializationError !== null);
	const isReady = $derived(appState.isReady);
	const currentBackground = $derived(appState.background as BackgroundType);
	const initializationErrorMsg = $derived(appState.initializationError || '');
	const loadingProgress = $derived(appState.loadingProgress);
	const loadingMessage = $derived(appState.loadingMessage);

	// FIXED: Event handlers with some debouncing but not too aggressive
	let actionTimeout: ReturnType<typeof setTimeout> | null = null;

	function throttledAction(action: () => void, delay: number = 50) {
		// Much lighter debouncing - just prevent rapid clicks
		if (actionTimeout) return;

		actionTimeout = setTimeout(() => {
			actionTimeout = null;
		}, delay);

		action();
	}

	function handleFullScreenToggle(isFull: boolean) {
		throttledAction(() => {
			appState.toggleFullScreen();
			hapticFeedbackService.trigger('success');
		});
	}

	function handleBackgroundChange(event: CustomEvent<string>) {
		throttledAction(() => {
			const validBackgrounds = ['snowfall', 'nightSky', 'deepOcean', 'none'] as const;
			type ValidBackground = (typeof validBackgrounds)[number];

			if (validBackgrounds.includes(event.detail as any)) {
				appState.setBackground(event.detail as ValidBackground);
			}
		});
	}

	function handleBackgroundReady() {
		appState.backgroundReady();
		appState.setLoading(false);
	}

	function handleTabChange(event: CustomEvent<number>) {
		throttledAction(() => {
			appState.setTab(event.detail);
		});
	}

	function handleRetry() {
		throttledAction(() => {
			appState.setInitializationError(null);
			appState.setLoading(true);
			appState.updateProgress(0, 'Retrying initialization...');
			// Simulate retry process
			setTimeout(() => {
				handleBackgroundReady();
			}, 1000);
		}, 100);
	}

	let initialized = false;

	onMount(() => {
		if (initialized) return;
		initialized = true;

		// Ensure we start with Construct tab (tab 0)
		appState.setTab(0);

		// Initialize immediately
		handleBackgroundReady();
	});

	// 🧪 NUCLEAR TEST: Add test beats to trigger hover loops
	async function addTestBeats() {
		try {
			const testPictographs = await getTestPictographsByLetters([Letter.A, Letter.B]);
			if (testPictographs.length > 0) {
				// Add start position first
				await sequenceState.setStartPosition(testPictographs[0]);

				// Add a beat
				if (testPictographs.length > 1) {
					await sequenceState.addBeat(testPictographs[1]);
				}
			}
		} catch (error) {
			console.error('Error adding test beats:', error);
		}
	}
</script>

<div id="main-widget" style="height: {windowHeight}" class="main-widget">
	<FullScreen ontoggleFullscreen={handleFullScreenToggle}>
		<!-- NUCLEAR TEST: BackgroundCanvas completely disabled to confirm it's the issue -->
		<div class="background" class:blur-background={isInitializingApp || hasFailed}>
			<BackgroundProvider
				backgroundType={currentBackground}
				isLoading={isInitializingApp || hasFailed}
				initialQuality={isInitializingApp || hasFailed ? 'medium' : 'high'}
			>
				<!-- PHASE 9B-2: BackgroundCanvas COMPLETELY DISABLED for testing -->
				<!-- <BackgroundCanvas
					backgroundType={currentBackground}
					appIsLoading={isInitializingApp || hasFailed}
					onReady={handleBackgroundReady}
					onPerformanceReport={handlePerformanceReport}
				/> -->

				<!-- Simple background replacement for testing -->
				<div
					style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, #0A0E2C, #4A5490); z-index: -1;"
				>
					<!-- BackgroundCanvas completely disabled for infinite loop testing -->
				</div>
			</BackgroundProvider>
		</div>

		{#if !isReady || hasFailed}
			<div class="loading-overlay-wrapper" transition:fade={{ duration: 300 }}>
				<EnhancedLoadingOverlay
					message={loadingMessage}
					progress={loadingProgress}
					onRetry={handleRetry}
					showInitializationError={hasFailed}
					errorMessage={initializationErrorMsg}
				/>
			</div>
		{/if}

		<div class="main-layout-wrapper">
			<MainLayout on:changeBackground={handleBackgroundChange} on:tabChange={handleTabChange} />
		</div>

		<!-- 🧪 NUCLEAR TEST: Test button to add beats and trigger hover loops -->
		<button
			style="position: fixed; top: 10px; right: 10px; background: orange; color: black; padding: 10px; z-index: 9999; border: 1px solid black; cursor: pointer;"
			onclick={addTestBeats}
		>
			🧪 Add Test Beats
		</button>
	</FullScreen>
</div>

<style>
	.main-widget {
		width: 100%;
		height: 100vh;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		transition: filter 0.3s ease-in-out;
	}

	.blur-background {
		filter: blur(5px);
	}

	.loading-overlay-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.main-layout-wrapper {
		position: relative;
		z-index: 1;
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}
</style>
