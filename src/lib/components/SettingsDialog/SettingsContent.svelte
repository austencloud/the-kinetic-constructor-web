<script lang="ts">
	import { browser } from '$app/environment';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	
	// Import tab components
	import SettingsTabs from './SettingsTabs.svelte';
	import GeneralTab from './GeneralTab/GeneralTab.svelte';
	import HapticTab from './HapticTab/HapticTab.svelte';
	import ImageExportTab from './ImageExportTab/ImageExportTab.svelte';
	
	// Props
	const { onClose } = $props<{
		onClose: () => void;
	}>();
	
	// Define tabs
	const tabs = [
		{ id: 'general', label: 'General', icon: 'fa-sliders' },
		{ id: 'haptic', label: 'Haptic Feedback', icon: 'fa-hand-pointer' },
		{ id: 'export', label: 'Image Export', icon: 'fa-image' }
	];
	
	// Active tab state
	let activeTab = $state('general');
	
	// Handle tab change
	function handleTabChange(tabId: string) {
		activeTab = tabId;
		
		// Provide haptic feedback for navigation
		if (browser) {
			hapticFeedbackService.trigger('navigation');
		}
	}
	
	// Handle close button click
	function handleClose() {
		// Provide haptic feedback
		if (browser) {
			hapticFeedbackService.trigger('selection');
		}
		
		// Call the close handler
		onClose();
	}
</script>

<div class="settings-container" role="dialog" aria-modal="true" aria-labelledby="settings-title">
	<div class="settings-header">
		<div class="settings-title">
			<i class="fa-solid fa-gear"></i>
			<h2 id="settings-title">Settings</h2>
		</div>
		
		<button onclick={handleClose} class="close-button" aria-label="Close settings">
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	
	<SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
	
	<div class="settings-content">
		{#if activeTab === 'general'}
			<GeneralTab />
		{:else if activeTab === 'haptic'}
			<HapticTab />
		{:else if activeTab === 'export'}
			<ImageExportTab />
		{/if}
	</div>
</div>

<style>
	.settings-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		background: rgba(30, 40, 60, 0.9);
		backdrop-filter: blur(10px);
		color: #e0e0e0;
		border-radius: 12px;
		overflow: hidden;
	}
	
	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(108, 156, 233, 0.2);
		background-color: rgba(20, 30, 50, 0.5);
	}
	
	.settings-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.settings-title i {
		font-size: 1.5rem;
		color: #6c9ce9;
	}
	
	.settings-title h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: white;
	}
	
	.close-button {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}
	
	.close-button i {
		font-size: 1.25rem;
	}
	
	.close-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
	}
	
	.settings-content {
		flex: 1;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(108, 156, 233, 0.3) transparent;
	}
	
	.settings-content::-webkit-scrollbar {
		width: 6px;
	}
	
	.settings-content::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.settings-content::-webkit-scrollbar-thumb {
		background-color: rgba(108, 156, 233, 0.3);
		border-radius: 3px;
	}
	
	/* Mobile styles */
	@media (max-width: 480px) {
		.settings-header {
			padding: 0.75rem 1rem;
		}
		
		.settings-title h2 {
			font-size: 1.1rem;
		}
	}
</style>
