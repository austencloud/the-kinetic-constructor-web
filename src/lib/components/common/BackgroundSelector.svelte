<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { getService } from '$lib/core/di/serviceContext';
	import { SERVICE_TOKENS } from '$lib/core/di/ServiceTokens';
	import type { BackgroundSystemFactory } from '$lib/core/services/BackgroundSystem';
	import type { BackgroundType } from '$lib/components/Backgrounds/types/types';

	// Props
	export let activeBackground: BackgroundType = 'snowfall';

	// Event dispatcher
	const dispatch = createEventDispatcher<{ change: BackgroundType }>();

	// Services
	let backgroundFactory: BackgroundSystemFactory;

	// Background options
	let availableBackgrounds: BackgroundType[] = ['snowfall', 'nightSky'];
	let supportedBackgrounds: BackgroundType[] = [];

	onMount(() => {
		backgroundFactory = getService<BackgroundSystemFactory>(SERVICE_TOKENS.BACKGROUND_FACTORY);

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
			dispatch('change', type);
		}
	}
</script>

<div class="background-selector">
	<h3>Background</h3>
	<div class="options">
		{#each supportedBackgrounds as background}
			<button
				class:active={activeBackground === background}
				on:click={() => setBackground(background)}
			>
				{background}
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
