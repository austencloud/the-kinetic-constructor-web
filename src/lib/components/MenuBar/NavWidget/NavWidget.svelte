<!-- src/lib/components/MenuBar/NavWidget/NavWidget.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import NavButton from './NavButton.svelte';
	import { isMobile, isPortrait } from '../../../utils/deviceUtils';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, quintOut } from 'svelte/easing';

	const dispatch = createEventDispatcher();

	let isMobileDevice = false;
	let isPortraitMode = false;

	let activeTab = 0;
	let previousTab = 0;
	let lastClickTime = 0; // Track when the last click happened

	const tabNames = ['Construct', 'Generate', 'Browse', 'Learn', 'Write'];
	const tabEmojis = ['⚒️', '🤖', '🔍', '🧠', '✍️'];

	function handleTabClick(index: number) {
		// Skip if clicking the already active tab
		if (index === activeTab) return;

		// CHANGE: Allow rapid clicks by not blocking based on animation
		// Instead, track click time to prevent programmatic issues
		const now = Date.now();
		if (now - lastClickTime < 50) {
			// If clicks are impossibly fast (programmatic or glitch), ignore
			return;
		}
		lastClickTime = now;

		// Store previous tab for animation direction
		previousTab = activeTab;

		// Update active tab immediately
		activeTab = index;

		// Dispatch an event to the parent component with the new tab index
		dispatch('tabChange', index);
	}

	const updateModes = () => {
		isMobileDevice = isMobile();
		isPortraitMode = isPortrait();
	};

	onMount(() => {
		updateModes();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateModes);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', updateModes);
			}
		};
	});

</script>

<div class="nav-widget">
	{#each tabNames as name, index}
		<div class="button-wrapper" class:active={index === activeTab}>
			{#key `tab-${index}-${activeTab === index}`}
				<NavButton isActive={index === activeTab} onClick={() => handleTabClick(index)}>
					{#if !isPortraitMode && !isMobileDevice}
						{#if index === activeTab}
							<div
								class="button-content"
								in:scale={{ duration: 400, delay: 50, easing: elasticOut }}
							>
								{name}
								<span class="emoji" in:scale={{ duration: 400, delay: 200 }}
									>{tabEmojis[index]}</span
								>
							</div>
						{:else}
							<div class="button-content">
								{name}
								{tabEmojis[index]}
							</div>
						{/if}
					{:else if isPortraitMode || isMobileDevice}
						{#if index === activeTab}
							<span class="emoji-only" in:scale={{ duration: 400, delay: 50, easing: elasticOut }}
								>{tabEmojis[index]}</span
							>
						{:else}
							<span class="emoji-only">{tabEmojis[index]}</span>
						{/if}
					{/if}
				</NavButton>
			{/key}

			{#if index === activeTab}
				<div class="active-tab-indicator" in:scale={{ duration: 300, delay: 200 }}></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.nav-widget {
		display: flex;
		justify-content: center;
		gap: 1.5vw; /* Increased gap between buttons */
		padding: 0.7rem;
		position: relative;
		overflow: visible;
	}

	.button-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		background:transparent
	}

	.emoji-only {
		font-size: 1.4em; /* Make emoji bigger */
		transition: transform 0.2s ease;
	}

	/* Tab indicator - appears below active tab */
	.active-tab-indicator {
		position: absolute;
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%);
		width: 30px;
		height: 3px;
		background: linear-gradient(to right, #1e3c72, #6c9ce9);
		border-radius: 10px;
		box-shadow: 0 0 8px rgba(108, 156, 233, 0.8);
	}

	/* Button content with animated emoji */
	.button-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.emoji {
		display: inline-block;
	}

	/* Enhanced hover effects */
	:global(.nav-widget .nav-button:hover) {
		transform: scale(1.08);
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		filter: brightness(1.1);
	}

	:global(.nav-widget .active .nav-button) {
		animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes pop {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.15);
		}
		100% {
			transform: scale(1);
		}
	}

	/* Light trail effect for the active button */
	:global(.nav-widget .active .nav-button::after) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 8px;
		box-shadow: 0 0 15px 2px rgba(108, 156, 233, 0.6);
		opacity: 0;
		animation: pulse-glow 2s infinite;
	}

	@keyframes pulse-glow {
		0% {
			opacity: 0;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 0;
		}
	}
</style>
