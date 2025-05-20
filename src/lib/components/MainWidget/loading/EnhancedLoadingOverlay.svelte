<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { resourceLoadingStatus } from '$lib/services/ResourcePreloader';

	// --- Props ---
	export let onRetry: () => void;
	export let showInitializationError: boolean = false;
	export let progress: number = 0;
	export let message: string = 'Loading...';
	export let errorMessage: string | null = null;

	// Local state
	let animatedProgress = 0;
	let dotCount = 0;
	let animationInterval: number;

	// Animate the progress bar and loading dots
	function startAnimation() {
		if (typeof window !== 'undefined') {
			clearInterval(animationInterval);
			animationInterval = window.setInterval(() => {
				// Smoothly animate progress toward target
				if (animatedProgress < progress) {
					animatedProgress = Math.min(progress, animatedProgress + 1);
				}

				// Animate loading dots
				dotCount = (dotCount + 1) % 4;
			}, 150);
		}
	}

	// Format the loading message with animated dots
	function getFormattedMessage(baseMessage: string): string {
		const dots = '.'.repeat(dotCount);
		return `${baseMessage}${dots}`;
	}

	// Get category-specific icon
	function getCategoryIcon(category: string | null): string {
		if (!category) return '📦';

		switch (category.toLowerCase()) {
			case 'props':
				return '🔄';
			case 'arrows':
				return '➡️';
			case 'grids':
				return '📐';
			case 'glyphs':
				return '🔤';
			default:
				return '📦';
		}
	}

	// Start animation when component mounts
	import { onMount, onDestroy } from 'svelte';

	onMount(() => {
		startAnimation();
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			clearInterval(animationInterval);
		}
	});

	// React to progress changes
	$: if (progress !== animatedProgress && typeof window !== 'undefined') {
		startAnimation();
	}
</script>

<div class="loading-overlay">
	<div class="loading-container">
		<LoadingSpinner />

		<div class="loading-progress-container">
			<div class="loading-progress-bar">
				<div class="loading-progress-fill" style="width: {animatedProgress}%"></div>
			</div>

			<div class="loading-details">
				<p class="loading-text">{getFormattedMessage(message)}</p>

				{#if $resourceLoadingStatus.inProgress}
					<div class="resource-loading-info" in:fade={{ duration: 200 }}>
						<div class="resource-category">
							<span class="category-icon">{getCategoryIcon($resourceLoadingStatus.category)}</span>
							<span class="category-text">
								{$resourceLoadingStatus.category
									? `Loading ${$resourceLoadingStatus.category}`
									: 'Preparing resources'}
							</span>
						</div>

						<div class="resource-stats">
							<span class="loaded-count">{$resourceLoadingStatus.loaded}</span>
							<span class="separator">/</span>
							<span class="total-count">{$resourceLoadingStatus.total}</span>

							{#if $resourceLoadingStatus.failed > 0}
								<span class="failed-count" in:scale={{ duration: 200 }}>
									({$resourceLoadingStatus.failed} failed)
								</span>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			{#if showInitializationError}
				<div class="error-container" in:fade={{ duration: 300 }}>
					<p class="error-text">
						{errorMessage ?? 'An error occurred during initialization.'}
					</p>
					<button class="retry-button" on:click={onRetry}>Retry</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
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
		background: rgba(11, 29, 42, 0.4);
		backdrop-filter: blur(2px);
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		padding: 30px;
		border-radius: 12px;
		background: rgba(30, 40, 60, 0.85);
		backdrop-filter: blur(5px);
		max-width: 400px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		animation: fadeIn 0.5s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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
		color: #fff;
		margin: 0;
		min-height: 24px;
	}

	.loading-details {
		margin-top: 10px;
	}

	.resource-loading-info {
		margin-top: 15px;
		padding: 10px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		font-size: 14px;
		color: #e0e0e0;
	}

	.resource-category {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 5px;
	}

	.category-icon {
		margin-right: 8px;
		font-size: 16px;
	}

	.resource-stats {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
	}

	.loaded-count {
		color: #6c9ce9;
		font-weight: bold;
	}

	.total-count {
		color: #e0e0e0;
	}

	.failed-count {
		color: #ff6b6b;
		font-size: 12px;
		margin-left: 5px;
	}

	.error-container {
		margin-top: 15px;
		padding: 10px;
		background: rgba(255, 0, 0, 0.1);
		border-radius: 8px;
	}

	.error-text {
		color: #ff6b6b;
		margin: 0 0 10px 0;
	}

	.retry-button {
		padding: 8px 20px;
		background: #3a7bd5;
		color: #fff;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background 0.2s;
	}

	.retry-button:hover {
		background: #2a5298;
	}
</style>
