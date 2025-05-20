<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { cacheStatus } from '$lib/services/ResourceCache';
	import { resourceLoadingStatus } from '$lib/services/ResourcePreloader';
	
	// Props
	export let visible: boolean = false;
	
	// Local state
	let refreshInterval: number;
	let isExpanded = false;
	
	// Format bytes to human-readable format
	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
	
	// Toggle expanded view
	function toggleExpanded() {
		isExpanded = !isExpanded;
	}
	
	// Start periodic refresh
	onMount(() => {
		if (typeof window !== 'undefined') {
			refreshInterval = window.setInterval(() => {
				// This will trigger reactivity on the stores
			}, 2000);
		}
	});
	
	// Clean up on destroy
	onDestroy(() => {
		if (typeof window !== 'undefined' && refreshInterval) {
			clearInterval(refreshInterval);
		}
	});
</script>

{#if visible}
	<div class="resource-cache-debug" class:expanded={isExpanded}>
		<div class="debug-header" on:click={toggleExpanded}>
			<h3>Resource Cache</h3>
			<span class="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
		</div>
		
		{#if isExpanded}
			<div class="debug-content">
				<div class="section">
					<h4>Cache Status</h4>
					<div class="stat-row">
						<span class="stat-label">Initialized:</span>
						<span class="stat-value">{$cacheStatus.initialized ? 'Yes' : 'No'}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Storage Type:</span>
						<span class="stat-value">{$cacheStatus.stats.storageType}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Total Entries:</span>
						<span class="stat-value">{$cacheStatus.stats.totalEntries}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Memory Usage:</span>
						<span class="stat-value">{formatBytes($cacheStatus.stats.memoryUsage)}</span>
					</div>
				</div>
				
				<div class="section">
					<h4>Categories</h4>
					{#each Object.entries($cacheStatus.stats.categories) as [category, count]}
						<div class="stat-row">
							<span class="stat-label">{category}:</span>
							<span class="stat-value">{count}</span>
						</div>
					{/each}
				</div>
				
				<div class="section">
					<h4>Loading Status</h4>
					<div class="stat-row">
						<span class="stat-label">In Progress:</span>
						<span class="stat-value">{$resourceLoadingStatus.inProgress ? 'Yes' : 'No'}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Current Category:</span>
						<span class="stat-value">{$resourceLoadingStatus.category || 'None'}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Progress:</span>
						<span class="stat-value">{$resourceLoadingStatus.progress}%</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Loaded:</span>
						<span class="stat-value">{$resourceLoadingStatus.loaded} / {$resourceLoadingStatus.total}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Failed:</span>
						<span class="stat-value">{$resourceLoadingStatus.failed}</span>
					</div>
				</div>
				
				{#if $resourceLoadingStatus.errors.length > 0}
					<div class="section errors">
						<h4>Errors ({$resourceLoadingStatus.errors.length})</h4>
						<div class="error-list">
							{#each $resourceLoadingStatus.errors.slice(0, 5) as error, i}
								<div class="error-item">
									<span class="error-resource">{error.resource}</span>
									<span class="error-message">{error.error}</span>
								</div>
							{/each}
							{#if $resourceLoadingStatus.errors.length > 5}
								<div class="more-errors">
									...and {$resourceLoadingStatus.errors.length - 5} more errors
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.resource-cache-debug {
		position: fixed;
		bottom: 10px;
		right: 10px;
		background-color: rgba(30, 40, 60, 0.9);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		color: white;
		font-family: monospace;
		font-size: 12px;
		z-index: 9999;
		max-width: 350px;
		max-height: 80vh;
		overflow: hidden;
		transition: all 0.3s ease;
	}
	
	.debug-header {
		padding: 8px 12px;
		background-color: rgba(0, 0, 0, 0.3);
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.debug-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: normal;
	}
	
	.toggle-icon {
		font-size: 10px;
	}
	
	.debug-content {
		padding: 10px;
		max-height: 60vh;
		overflow-y: auto;
	}
	
	.section {
		margin-bottom: 15px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 10px;
	}
	
	.section h4 {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: #6c9ce9;
	}
	
	.stat-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
	}
	
	.stat-label {
		color: #aaa;
	}
	
	.stat-value {
		font-weight: bold;
	}
	
	.errors {
		color: #ff6b6b;
	}
	
	.error-list {
		max-height: 150px;
		overflow-y: auto;
		background-color: rgba(255, 0, 0, 0.1);
		border-radius: 4px;
		padding: 5px;
	}
	
	.error-item {
		margin-bottom: 5px;
		padding-bottom: 5px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 11px;
	}
	
	.error-resource {
		display: block;
		font-weight: bold;
		margin-bottom: 2px;
	}
	
	.error-message {
		display: block;
		color: #ff9999;
		word-break: break-word;
	}
	
	.more-errors {
		font-style: italic;
		text-align: center;
		padding: 5px;
		color: #ff9999;
	}
	
	.expanded {
		width: 350px;
	}
</style>
