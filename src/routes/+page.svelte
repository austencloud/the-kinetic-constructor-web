<script lang="ts">
	import { onMount } from '$lib/utils/svelte-lifecycle';
	import { fade } from 'svelte/transition';
	import { untrack } from 'svelte';

	// Components
	import FullScreen from '$lib/AppFullScreen.svelte';
	import MainLayout from '$lib/components/MainWidget/layout/MainLayout.svelte';
	import EnhancedLoadingOverlay from '$lib/components/MainWidget/loading/EnhancedLoadingOverlay.svelte';
	import BackgroundCanvas from '$lib/components/Backgrounds/BackgroundCanvas.svelte';
	import BackgroundProvider from '$lib/components/Backgrounds/BackgroundProvider.svelte';

	// State Management
	import { appActions } from '$lib/state/machines/app/app.actions';
	import { useSelector } from '@xstate/svelte';
	import { appService } from '$lib/state/machines/app/app.machine';
	import { uiStore } from '$lib/state/stores/uiStore';
	import type { BackgroundType } from '$lib/components/Backgrounds/types/types';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// FIXED: Keep the useSelector pattern but add some loop prevention
	const windowHeight = $derived($uiStore ? $uiStore.windowHeight + 'px' : '100vh');

	// Keep the XState selectors - they're needed for proper state machine integration!
	const isInitializingAppStore = useSelector(appService, (state) =>
		state.matches('initializingApp')
	);
	const isInitializingApp = $derived($isInitializingAppStore);

	const hasFailedStore = useSelector(appService, (state) => state.matches('initializationFailed'));
	const hasFailed = $derived($hasFailedStore);

	const isReadyStore = useSelector(appService, (state) => state.matches('ready'));
	const isReady = $derived($isReadyStore);

	const currentBackgroundStore = useSelector(appService, (state) => state.context.background);
	const currentBackground = $derived($currentBackgroundStore as BackgroundType);

	const initializationErrorMsgStore = useSelector(
		appService,
		(state) => state.context.initializationError
	);
	const initializationErrorMsg = $derived($initializationErrorMsgStore as string);

	const loadingProgressStore = useSelector(appService, (state) => state.context.loadingProgress);
	const loadingProgress = $derived($loadingProgressStore as number);

	const loadingMessageStore = useSelector(appService, (state) => state.context.loadingMessage);
	const loadingMessage = $derived($loadingMessageStore as string);

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
			appActions.setFullScreen(isFull);
			hapticFeedbackService.trigger('success');
		});
	}

	function handleBackgroundChange(event: CustomEvent<string>) {
		throttledAction(() => {
			const validBackgrounds = ['snowfall', 'nightSky', 'deepOcean'] as const;
			type ValidBackground = (typeof validBackgrounds)[number];

			if (validBackgrounds.includes(event.detail as any)) {
				appActions.updateBackground(event.detail as ValidBackground);
			}
		});
	}

	function handleBackgroundReady() {
		// Don't debounce this one - it's critical for initialization
		appActions.backgroundReady();
	}

	function handlePerformanceReport(_metrics: {
		fps: number;
		memory?: { used: number; total: number };
	}) {
		// Leave performance reports alone
	}

	function handleTabChange(event: CustomEvent<number>) {
		throttledAction(() => {
			appActions.changeTab(event.detail);
		});
	}

	function handleRetry() {
		throttledAction(() => {
			appActions.retryInitialization();
		}, 100);
	}

	// FIXED: Much more conservative lifecycle approach
	let hasInitialized = false;

	onMount(() => {
		if (hasInitialized) return;
		hasInitialized = true;

		// Just a small delay to let things settle, not too long
		setTimeout(() => {
			appActions.backgroundReady();
		}, 200);
	});
</script>

<div id="main-widget" style="height: {windowHeight}" class="main-widget">
	<FullScreen ontoggleFullscreen={handleFullScreenToggle}>
		<div class="background" class:blur-background={isInitializingApp || hasFailed}>
			<BackgroundProvider
				backgroundType={currentBackground}
				isLoading={isInitializingApp || hasFailed}
				initialQuality={isInitializingApp || hasFailed ? 'medium' : 'high'}
			>
				<BackgroundCanvas
					backgroundType={currentBackground}
					appIsLoading={isInitializingApp || hasFailed}
					onReady={handleBackgroundReady}
					onPerformanceReport={handlePerformanceReport}
				/>
			</BackgroundProvider>
		</div>

		{#if isInitializingApp || hasFailed}
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

		{#if isReady}
			<div class="main-layout-wrapper" transition:fade={{ duration: 500, delay: 100 }}>
				<MainLayout on:changeBackground={handleBackgroundChange} on:tabChange={handleTabChange} />
			</div>
		{/if}
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