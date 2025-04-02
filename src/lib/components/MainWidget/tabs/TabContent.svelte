<!-- src/lib/components/MainWidget/tabs/TabContent.svelte -->
<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { activeTab, slideDirection, tabs, appState } from '../state/appState';
    import PlaceholderTab from './PlaceholderTab.svelte';
    import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
    import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
    import StartPosPicker from '$lib/components/StartPosPicker/StartPosPicker.svelte';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
    
    export let isVisible: boolean = true;
    
    // NEW: Track previous tab for persistent rendering
    let previousRenderedTab = $activeTab.id;
    let currentTabId = $activeTab.id;
    
    // NEW: Flag to indicate if this is the initial render
    let isInitialRender = true;
    
    // NEW: Map of component data to pre-render
    let preRenderedComponents: Record<string, { loaded: boolean }> = {};
    
    // NEW: Update current tab when active tab changes
    $: if ($activeTab.id !== currentTabId) {
        // Store previous tab for reference
        previousRenderedTab = currentTabId;
        currentTabId = $activeTab.id;
        isInitialRender = false;
    }
    
    // NEW: Preloading logic - could be extended to store component states
    function ensureTabPreloaded(tabId: string) {
        if (!preRenderedComponents[tabId]) {
            preRenderedComponents[tabId] = { loaded: true };
        }
        return preRenderedComponents[tabId];
    }
    
    // NEW: Always ensure current tab is preloaded
    $: ensureTabPreloaded(currentTabId);
</script>

<!-- NEW: Fixed container to maintain layout structure -->
<div class="tab-content-container">
    {#if isVisible}
        {#key currentTabId}
            {#if $activeTab.splitView}
                <!-- Split view layout for sequence workbench -->
                <div class="split-view-container">
                    <!-- NEW: Wrapper for consistent positioning -->
                    <div 
                        class="sequenceWorkbenchContainer"
                        in:fly={{ 
                            duration: 500, 
                            x: $slideDirection ? 100 : -100, 
                            delay: 50
                        }}
                    >
                        <SequenceWorkbench />
                    </div>

                    <!-- NEW: Fixed position container for option/start pickers -->
                    <div 
                        class="optionPickerContainer"
                        in:fly={{ 
                            duration: 500, 
                            delay: 200, 
                            x: $slideDirection ? 100 : -100 
                        }}
                    >
                        <!-- Conditionally show StartPosPicker or OptionPicker -->
                        {#if $selectedStartPos}
                            <OptionPicker />
                        {:else}
                            <StartPosPicker />
                        {/if}
                    </div>
                </div>
            {:else if $activeTab.component}
                <!-- Full view for components that don't need split view -->
                <div
                    class="fullViewComponent"
                    in:fly={{ 
                        duration: 500, 
                        x: $slideDirection ? 100 : -100,
                        opacity: 0.2
                    }}
                >
                    <svelte:component this={$activeTab.component} />
                </div>
            {:else}
                <!-- Placeholder for features under development -->
                <div
                    class="placeholderContainer"
                    in:fly={{ 
                        duration: 500, 
                        x: $slideDirection ? 100 : -100,
                        opacity: 0.2
                    }}
                >
                    <PlaceholderTab icon={$activeTab.icon} title={$activeTab.title} />
                </div>
            {/if}
        {/key}
    {/if}
</div>

<style>
    /* NEW: Fixed container to prevent layout shifts */
    .tab-content-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    
    /* NEW: Container for split view to maintain consistent layout */
    .split-view-container {
        display: flex;
        width: 100%;
        height: 100%;
        position: relative;
    }
    
    .sequenceWorkbenchContainer, 
    .optionPickerContainer {
        flex: 1;
        position: relative;
        height: 100%;
        display: flex;
        overflow: hidden;
    }
    
    .fullViewComponent,
    .placeholderContainer {
        width: 100%;
        height: 100%;
        position: relative;
    }
    
    /* Responsive layouts */
    @media (orientation: portrait) {
        .split-view-container {
            flex-direction: column;
        }
        
        .sequenceWorkbenchContainer {
            flex: 2;
        }
        
        .optionPickerContainer {
            flex: 1;
        }
    }
    
    @media (orientation: landscape) {
        .split-view-container {
            flex-direction: row;
        }
        
        .sequenceWorkbenchContainer {
            width: 50%;
        }
        
        .optionPickerContainer {
            width: 50%;
        }
    }
</style>