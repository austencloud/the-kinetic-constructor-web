<!--
  Modern Service Provider Component
  Provides dependency injection for all services using Svelte 5 context
  Eliminates direct imports and enables proper testing
-->
<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	// Props interface for Svelte 5 children
	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	// Create services synchronously during component initialization
	let sequenceService: any = $state(null);
	let workbenchService: any = $state(null);

	// Initialize services immediately (synchronously)
	async function initializeServices() {
		try {
			const [sequenceModule, workbenchModule] = await Promise.all([
				import('../services/SequenceService.svelte'),
				import('../services/WorkbenchService.svelte')
			]);

			const SequenceService = sequenceModule.SequenceService;
			const WorkbenchService = workbenchModule.WorkbenchService;

			const sequence = new SequenceService({
				autoSave: true,
				autoSaveDelay: 1000,
				maxBeats: 100,
				enablePlayback: true,
				persistenceKey: 'modern_sequence_state'
			});

			const workbench = new WorkbenchService({
				defaultPanel: 'generate',
				enableFullscreen: true,
				persistenceKey: 'modern_workbench_state'
			});

			// Set services immediately
			sequenceService = sequence;
			workbenchService = workbench;

			console.log('✅ ModernServiceProvider: Services initialized synchronously');
			isInitialized = true;
			isServicesReady = true;

			// Load saved data
			const loaded = sequenceService.loadFromLocalStorage();
			if (loaded) {
				console.log('✅ Modern: Loaded saved sequence from localStorage');
			}

			return { sequence, workbench };
		} catch (error) {
			console.error('❌ ModernServiceProvider: Failed to initialize services:', error);
			initializationError = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		}
	}

	let isInitialized = $state(false);
	let isServicesReady = $state(false);
	let initializationError = $state<string | null>(null);

	let performanceMetrics = $state({
		renderTime: 0,
		memoryUsage: 0,
		lastUpdate: Date.now()
	});

	// Safe development environment detection
	const isDev = browser && (typeof window !== 'undefined' && window.location.hostname === 'localhost');

	// Set context with reactive getters that will update when services are ready
	// This ensures context is available during component initialization
	setContext('sequenceService', () => {
		if (isDev) {
			console.log('🔧 ModernServiceProvider: Context getter called for sequenceService:', {
				hasService: !!sequenceService,
				serviceType: sequenceService?.constructor?.name || 'null',
				isInitialized
			});
		}
		return sequenceService;
	});
	setContext('workbenchService', () => {
		if (isDev) {
			console.log('🔧 ModernServiceProvider: Context getter called for workbenchService:', {
				hasService: !!workbenchService,
				serviceType: workbenchService?.constructor?.name || 'null',
				isInitialized
			});
		}
		return workbenchService;
	});

	// Initialize services during component initialization
	if (browser) {
		console.log('🔧 ModernServiceProvider: Initializing services...');

		// Initialize services immediately
		initializeServices().catch((error) => {
			console.error('ModernServiceProvider: Failed to initialize services:', error);
			initializationError =
				error instanceof Error ? error.message : 'Service initialization failed';
		});
	}

	// Setup additional functionality after component mounts
	onMount(() => {
		if (!browser || !isInitialized) return;

		let cleanupFunctions: (() => void)[] = [];

		function handleError(event: ErrorEvent) {
			if (workbenchService) {
				workbenchService.setError(`Application error: ${event.message}`);
			}
			console.error('Modern: Global error caught:', event.error);
		}

		function handleUnhandledRejection(event: PromiseRejectionEvent) {
			if (workbenchService) {
				workbenchService.setError(`Promise rejection: ${event.reason}`);
			}
			console.error('Modern: Unhandled promise rejection:', event.reason);
		}

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		const interval = setInterval(() => {
			if ('memory' in performance) {
				performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
				performanceMetrics.lastUpdate = Date.now();
			}
		}, 5000);

		if (isDev) {
			(window as any).__modernServices = {
				sequence: sequenceService,
				workbench: workbenchService,
				performance: performanceMetrics
			};
			console.log('🔧 Modern services exposed globally as window.__modernServices');
		}

		// Store cleanup functions
		cleanupFunctions.push(
			() => window.removeEventListener('error', handleError),
			() => window.removeEventListener('unhandledrejection', handleUnhandledRejection),
			() => clearInterval(interval)
		);

		// Return cleanup function
		return () => {
			cleanupFunctions.forEach((cleanup) => cleanup());
		};
	});

	const hasError = $derived(initializationError || workbenchService?.state?.error);
	const isLoading = $derived(!isServicesReady || workbenchService?.state?.isLoading);
</script>

{#if initializationError}
	<div class="service-error-boundary">
		<div class="error-content">
			<h2>Service Initialization Error</h2>
			<p>{initializationError}</p>
			<button
				onclick={() => {
					initializationError = null;
					window.location.reload();
				}}
			>
				Retry Initialization
			</button>
			<button onclick={() => window.location.reload()}> Reload Application </button>
		</div>
	</div>
{:else if hasError && workbenchService}
	<div class="service-error-boundary">
		<div class="error-content">
			<h2>Service Error</h2>
			<p>{hasError}</p>
			<button onclick={() => workbenchService.clearError()}> Dismiss </button>
			<button onclick={() => window.location.reload()}> Reload Application </button>
		</div>
	</div>
{:else}
	{#if isLoading}
		<div class="service-loading">
			<div class="loading-spinner"></div>
			<p>Initializing modern services...</p>
		</div>
	{/if}

	{@render children?.()}
{/if}

{#if isDev && isInitialized}
	<div class="performance-monitor">
		<details>
			<summary>🚀 Modern Services</summary>
			<div class="metrics">
				<div>Memory: {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)} MB</div>
				<div>Services: {isInitialized ? 'Active' : 'Initializing'}</div>
				<div>Status: Running</div>
			</div>
		</details>
	</div>
{/if}

<style>
	.service-error-boundary {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
	}

	.error-content {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		max-width: 400px;
		text-align: center;
	}

	.error-content h2 {
		color: #dc2626;
		margin-bottom: 1rem;
	}

	.error-content button {
		margin: 0.5rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.error-content button:first-of-type {
		background: #6b7280;
		color: white;
	}

	.error-content button:last-of-type {
		background: #dc2626;
		color: white;
	}

	.service-loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.performance-monitor {
		position: fixed;
		top: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		z-index: 9998;
	}

	.performance-monitor summary {
		cursor: pointer;
		user-select: none;
	}

	.metrics {
		margin-top: 0.5rem;
		font-family: monospace;
	}

	.metrics div {
		margin: 0.25rem 0;
	}
</style>
