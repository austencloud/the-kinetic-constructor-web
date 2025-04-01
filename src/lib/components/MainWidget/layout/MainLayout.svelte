<!-- src/lib/components/MainWidget/layout/MainLayout.svelte -->
<script lang="ts">
    import { loadingState } from '$lib/stores/loadingStateStore';
    import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
    import LoadingOverlay from '../loading/LoadingOverlay.svelte';
    import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
    import TabContent from '../tabs/TabContent.svelte';
    import { appState, activeTab } from '../state/appState';
    import { createEventDispatcher } from 'svelte';
    
    // Props with defaults
    export let background: string = 'Snowfall';
    export let onSettingsClick: () => void; // This needs to be forwarded to MenuBar
    export let onRetry: () => void;
    
    // Reactive values from appState
    $: isSettingsDialogOpen = $appState.isSettingsDialogOpen;
    $: contentVisible = $appState.contentVisible;
    $: initializationError = $appState.initializationError;
    
    // Create event dispatcher for forwarding events from child components
    const dispatch = createEventDispatcher();
    
    // Function to close the settings dialog
    const handleCloseSettings = () => {
        appState.update(s => ({ ...s, isSettingsDialogOpen: false }));
    };
</script>

{#if $loadingState.isLoading}
    <!-- Loading state -->
    <LoadingOverlay {onRetry} showInitializationError={initializationError} />
{:else}
    <div class="content">
        <!-- Menu Bar -->
        <div class="menuBar">
            <MenuBar
                {background}
                on:settingsClick={() => onSettingsClick()}
                on:changeBackground
                on:tabChange
            />
        </div>

        <!-- Main Content Area -->
        <div 
            class="mainContent" 
            class:hidden={!contentVisible}
        >
            <TabContent isVisible={contentVisible} />
        </div>

        <!-- Settings Dialog -->
        {#if isSettingsDialogOpen}
            <SettingsDialog
                isOpen={isSettingsDialogOpen}
                {background}
                on:changeBackground
                onClose={handleCloseSettings}
            />
        {/if}
    </div>
{/if}

<style>
    .content {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }
    
    .mainContent {
        display: flex;
        flex: 1;
        overflow: hidden;
        position: relative;
        z-index: 0;
        width: 100%;
        opacity: 1;
        transition: opacity 0.3s ease;
    }
    
    .mainContent.hidden {
        opacity: 0;
    }
</style>