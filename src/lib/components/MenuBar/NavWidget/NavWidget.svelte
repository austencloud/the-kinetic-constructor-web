<script lang="ts">
	import { onMount } from 'svelte';
	import NavButton from './NavButton.svelte';
	import { scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import { appSelectors, appActions } from '$lib/state/machines/appMachine';
	import { uiStore } from '$lib/state/stores/uiStore';

	// Get state from the app state machine
	$: activeTab = appSelectors.currentTab();
	$: previousTab = appSelectors.previousTab();

	// Get device information from the UI store
	$: isMobileDevice = $uiStore.isMobile;
	$: isPortraitMode = !$uiStore.isDesktop && $uiStore.windowHeight > $uiStore.windowWidth;

	let lastClickTime = 0;

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	// Determine if text should be shown based on device/orientation
	$: showButtonText = !isMobileDevice && !isPortraitMode;

	function handleTabClick(index: number) {
		if (index === activeTab) return;

		const now = Date.now();
		if (now - lastClickTime < 50) return; // Debounce rapid clicks
		lastClickTime = now;

		// Update the app state machine
		appActions.changeTab(index);

		// Dispatch the event for any parent components that might be listening
		const event = new CustomEvent('tabChange', { detail: index });
		dispatchEvent(event);
	}

	// Update device/orientation state if UI store is not available
	const updateModes = () => {
		if (typeof window !== 'undefined') {
			uiStore.updateWindowDimensions(window.innerWidth, window.innerHeight);
		}
	};

	onMount(() => {
		updateModes();
	});
</script>

<div class="nav-widget">
	{#each tabNames as name, index}
		<div class="button-wrapper" class:active={index === activeTab}>
			{#key `tab-${index}-${activeTab === index}-${showButtonText}`}
				<NavButton
					isActive={index === activeTab}
					onClick={() => handleTabClick(index)}
					{index}
					previousIndex={previousTab}
					showText={showButtonText}
				>
					{#if showButtonText}
						<div
							class="button-content landscape"
							in:scale={{ duration: 400, delay: 50, easing: elasticOut }}
						>
							{name}
							<span class="emoji">{tabEmojis[index]}</span>
						</div>
					{:else}
						<div
							class="button-content portrait"
							in:scale={{ duration: 400, delay: 50, easing: elasticOut }}
						>
							<span class="emoji-only">{tabEmojis[index]}</span>
						</div>
					{/if}
				</NavButton>
			{/key}

			{#if index === activeTab}
				<div
					class="active-tab-indicator"
					class:round={!showButtonText}
					in:scale={{ duration: 300, delay: 200, start: 0.5 }}
				></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.nav-widget {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.75rem; /* Fixed gap */
		position: relative;
		overflow: visible;
		padding: 4px 0;
	}

	.button-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: transparent;
	}

	/* Content alignment within the button slot */
	.button-content {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
	.button-content.landscape {
		gap: 0.4rem;
	}

	.emoji {
		display: inline-block;
		font-size: 1.1em;
	}
	.emoji-only {
		line-height: 1;
	}

	/* Tab indicator */
	.active-tab-indicator {
		position: absolute;
		bottom: -6px;
		left: 50%;
		transform: translateX(-50%);
		width: 60%;
		max-width: 35px;
		height: 3px;
		background: linear-gradient(to right, #6c9ce9, #1e3c72);
		border-radius: 10px;
		box-shadow: 0 0 6px rgba(108, 156, 233, 0.7);
		transition: width 0.3s ease;
	}
	.active-tab-indicator.round {
		width: 40%;
		max-width: 20px;
		bottom: -4px;
	}
</style>
