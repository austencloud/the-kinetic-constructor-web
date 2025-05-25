<script lang="ts">
	import { onMount } from 'svelte';
	import { getService } from '$lib/core/di/serviceContext';
	import { SERVICE_TOKENS } from '$lib/core/di/ServiceTokens';
	import type { BackgroundSystemFactory } from '$lib/core/services/BackgroundSystem';
	import type { BackgroundType } from '$lib/components/Backgrounds/types/types';

	// Props using Svelte 5 runes
	let { activeBackground = $bindable('snowfall'), onchange } = $props<{
		activeBackground?: BackgroundType;
		onchange?: (type: BackgroundType) => void;
	}>();

	// Services
	let backgroundFactory: BackgroundSystemFactory;
	let backgroundService: any; // Using any for simplicity

	// Background options
	let availableBackgrounds = $state<BackgroundType[]>([]);
	let supportedBackgrounds = $state<BackgroundType[]>([]);

	onMount(() => {
		backgroundFactory = getService<BackgroundSystemFactory>(SERVICE_TOKENS.BACKGROUND_FACTORY);
		backgroundService = getService(SERVICE_TOKENS.BACKGROUND_SERVICE);

		// Get available backgrounds from the service
		availableBackgrounds = backgroundService.getAvailableBackgrounds();

		// Filter to only supported backgrounds
		supportedBackgrounds = availableBackgrounds.filter((type) =>
			backgroundFactory.isBackgroundSupported(type)
		);

		// Ensure active background is supported
		if (!supportedBackgrounds.includes(activeBackground)) {
			setBackground(supportedBackgrounds[0] || 'snowfall');
		}
	});

	function setBackground(type: BackgroundType) {
		if (activeBackground !== type) {
			activeBackground = type;
			onchange?.(type);
		}
	}

	// Function to get a user-friendly display name for each background
	const displayNames: Record<BackgroundType, string> = {
		snowfall: 'Snowfall',
		nightSky: 'Night Sky',
		deepOcean: 'Deep Ocean'
	};

	function getDisplayName(type: BackgroundType): string {
		return displayNames[type] || type;
	}
</script>

<div class="background-selector">
	<h3>Background</h3>
	<div class="options">
		{#each supportedBackgrounds as background}
			<button
				class:active={activeBackground === background}
				onclick={() => setBackground(background)}
			>
				{getDisplayName(background)}
			</button>
		{/each}
	</div>
</div>

<style>
	.background-selector {
		padding: 10px;
	}

	.options {
		display: flex;
		gap: 8px;
	}

	button {
		padding: 5px 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: #f5f5f5;
		cursor: pointer;
	}

	button.active {
		background: #0056b3;
		color: white;
		border-color: #0056b3;
	}
</style>
