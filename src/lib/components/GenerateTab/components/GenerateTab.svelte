<!-- src/lib/components/GenerateTab/GenerateTab.svelte -->
<script lang="ts">
	// Import state management
	import { onMount } from 'svelte';
	import { settingsState } from '$lib/state/simple/settingsState.svelte';

	// Import layout components
	import GenerateTabContent from './GenerateTabContent.svelte';

	// Initialization logic
	onMount(() => {
		// Settings are already initialized in settingsState.svelte.ts
		console.log('GenerateTab mounted with settings:', settingsState.getSnapshot());
	});
</script>

<div class="generate-tab">
	<GenerateTabContent />
</div>

<style>
	.generate-tab {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		padding: 1.5rem;
		gap: 1.5rem;
		color: var(--color-text-primary, white);
		position: relative;
		overflow: hidden;
	}

	/* Add subtle background pattern */
	.generate-tab::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image:
			radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
		background-size: 40px 40px;
		background-position:
			0 0,
			20px 20px;
		pointer-events: none;
		z-index: 0;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.generate-tab {
			padding: 1rem;
		}
	}
</style>
