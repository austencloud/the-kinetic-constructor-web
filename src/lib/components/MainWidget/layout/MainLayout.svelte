<script lang="ts">
	import TabContent from '../tabs/TabContent.svelte';
	import { onMount } from 'svelte';
	import SettingsContent from '$lib/components/SettingsDialog/SettingsContent.svelte';
	import { appActions } from '$lib/state/machines/app/app.actions';
	import { useSelector } from '@xstate/svelte';
	import { appService } from '$lib/state/machines/app/app.machine';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut, quintOut } from 'svelte/easing';
	import { uiStore } from '$lib/state/stores/uiStore';

	const isSettingsOpenStore = useSelector(appService, (state) => state.context.isSettingsOpen);
	$: isSettingsDialogOpen = $isSettingsOpenStore;

	let buttonSize = 50;
	let iconSize = 38;

	$: if ($uiStore && $uiStore.windowWidth) {
		buttonSize = Math.max(30, Math.min(50, $uiStore.windowWidth / 12));
		iconSize = buttonSize * 0.75;
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			buttonSize = Math.max(30, Math.min(50, window.innerWidth / 12));
			iconSize = buttonSize * 0.75;
		}
		appActions.changeTab(0);
	});

	function handleToggleSettings() {
		if (isSettingsDialogOpen) {
			appActions.closeSettings();
		} else {
			appActions.openSettings();
		}
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
			appActions.closeSettings();
		}
	}
</script>

<div class="content">
	<div class="settings-button-container">
		<button
			class="settings-button"
			style="--button-size: {buttonSize}px;"
			on:click={handleToggleSettings}
			aria-label="Settings"
		>
			<div class="button-content">
				<i
					class="fa-solid fa-gear settings-icon"
					style="--icon-size: {iconSize}px;"
					aria-hidden="true"
				></i>
			</div>
			<div class="button-background"></div>
		</button>
	</div>

	<div class="mainContent">
		<TabContent />
	</div>

	{#if isSettingsDialogOpen}
		<div
			class="settingsBackdrop"
			transition:fade={{ duration: 300, easing: cubicOut }}
			on:click={() => appActions.closeSettings()}
			on:keydown={handleBackdropKeydown}
			role="button"
			tabindex="0"
			aria-label="Close settings"
		></div>
		<div
			class="settingsContent"
			in:fly={{ y: 20, duration: 400, delay: 100, easing: quintOut }}
			out:fade={{ duration: 200, easing: cubicOut }}
		>
			<SettingsContent onClose={() => appActions.closeSettings()} />
		</div>
	{/if}
</div>

<style>
	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		z-index: 1;
		width: 100%;
		position: relative;
	}
	.settings-button-container {
		position: absolute;
		top: 15px;
		left: 15px;
		z-index: 5;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.mainContent {
		display: flex;
		flex: 1;
		overflow: hidden;
		position: relative;
		z-index: 0;
		width: 100%;
		opacity: 1;
	}
	.settingsBackdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 9;
		cursor: pointer;
	}

	.settingsContent {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 800px;
		max-height: 90vh;
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		z-index: 10;
		overflow: hidden;
	}

	.settings-button {
		width: var(--button-size);
		height: var(--button-size);
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		border: none;
		border-radius: 12px;
		background-color: transparent;
		color: rgba(255, 255, 255, 0.9);
		transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		padding: 0;
		overflow: hidden;
		position: relative;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
	}

	.button-content {
		position: relative;
		z-index: 2;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	.button-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		z-index: 1;
	}

	.settings-button:hover {
		transform: translateY(-2px);
		color: #6c9ce9;
	}

	.settings-button:hover .button-background {
		background: rgba(30, 60, 114, 0.4);
		border-color: rgba(108, 156, 233, 0.3);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.settings-button:active {
		transform: translateY(0);
	}

	.settings-button:active .button-background {
		background: rgba(30, 60, 114, 0.6);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.settings-button:focus-visible {
		outline: none;
	}

	.settings-button:focus-visible .button-background {
		box-shadow: 0 0 0 2px rgba(108, 156, 233, 0.6);
	}

	.settings-icon {
		font-size: var(--icon-size);
		line-height: 1;
		transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		display: block;
	}

	.settings-button:hover .settings-icon {
		transform: rotate(90deg);
	}

	@media (max-width: 768px) {
		.settings-button-container {
			top: 10px;
			left: 10px;
			right: auto;
		}

		.settings-button {
			border-radius: 10px;
		}

		.button-background {
			border-radius: 10px;
		}
	}

	@supports (padding-top: env(safe-area-inset-top)) {
		.settings-button-container {
			top: max(15px, env(safe-area-inset-top));
			left: max(15px, env(safe-area-inset-left));
			right: auto;
		}
	}
</style>
