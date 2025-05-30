<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props using Svelte 5 runes
	const { buttonText = 'Install App', showInstallPrompt = false } = $props<{
		buttonText?: string;
		showInstallPrompt?: boolean;
	}>();

	let canInstall = $state(false);

	// Standard event handlers from pwa.ts
	onMount(() => {
		if (!browser) return;

		// Check if the app can be installed
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			window.deferredPrompt = e;
			canInstall = true;
		});

		// Update state when app is installed
		window.addEventListener('appinstalled', () => {
			window.deferredPrompt = null;
			canInstall = false;
		});
	});

	// Handle install button click
	function promptInstall() {
		if (!browser || !window.deferredPrompt) return;

		const promptEvent = window.deferredPrompt;
		promptEvent.prompt();

		promptEvent.userChoice.then(() => {
			window.deferredPrompt = null;
			canInstall = false;
		});
	}
</script>

{#if showInstallPrompt && canInstall}
	<button class="install-button" onclick={promptInstall} aria-label="Install application">
		<span class="install-icon">📱</span>
		<span class="install-text">{buttonText}</span>
	</button>
{/if}

<style>
	.install-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 8px 16px;
		background-color: #1e3c72;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition:
			background-color 0.2s,
			transform 0.1s;
	}

	.install-button:hover {
		background-color: #2a52be;
		transform: translateY(-1px);
	}

	.install-button:active {
		transform: translateY(1px);
	}

	.install-icon {
		font-size: 1.2em;
	}
</style>
