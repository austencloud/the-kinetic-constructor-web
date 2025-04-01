<!-- src/lib/components/MainWidget/tabs/TabContent.svelte -->
<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { activeTab, slideDirection, tabs, appState } from '../state/appState';
    import { selectedStartPos } from '$lib/stores/constructStores';
    import PlaceholderTab from './PlaceholderTab.svelte';
    import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
    import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
    import StartPosPicker from '$lib/components/StartPosPicker/StartPosPicker.svelte';
    
    export let isVisible: boolean = true;
    
    // ADDED: Track what content we're displaying
    let currentTabId = $activeTab.id;
    let isTransitioning = false;
    
    // ADDED: Handle rapid tab transitions
    $: if ($activeTab.id !== currentTabId) {
        // Tab has changed, update immediately
        currentTabId = $activeTab.id;
        isTransitioning = true;
        
        // Reset transition state after animation completes
        setTimeout(() => {
            isTransitioning = false;
        }, 600); // Set this higher than your animation duration
    }
    
    // ADDED: Use shorter animation durations for rapid tab switching
    $: animationDuration = isTransitioning ? 300 : 500;
</script>

<!-- Use currentTabId as key instead of directly using $activeTab -->
{#if isVisible}
    {#key currentTabId}
        {#if $activeTab.splitView}
            <!-- Split view layout for sequence workbench -->
            <div
                class="sequenceWorkbenchContainer"
                in:fly={{ 
                    duration: animationDuration, 
                    x: $slideDirection ? 100 : -100 
                }}
                out:fly={{ 
                    duration: 200, // Faster exit animation
                    x: $slideDirection ? -100 : 100 
                }}
            >
                <SequenceWorkbench />
            </div>

            <div
                class="optionPickerContainer"
                in:fly={{ 
                    duration: animationDuration, 
                    delay: Math.min(100, isTransitioning ? 0 : 200), // Reduce delay on rapid changes
                    x: $slideDirection ? 100 : -100 
                }}
                out:fly={{ 
                    duration: 200, // Faster exit animation
                    x: $slideDirection ? -100 : 100 
                }}
            >
                <!-- Conditionally show StartPosPicker or OptionPicker -->
                {#if $selectedStartPos}
                    <OptionPicker />
                {:else}
                    <StartPosPicker />
                {/if}
            </div>
        {:else if $activeTab.component}
            <!-- Full view for components that don't need split view -->
            <div
                class="fullViewComponent"
                in:fly={{ 
                    duration: animationDuration, 
                    x: $slideDirection ? 100 : -100,
                    opacity: 0.2
                }}
                out:fade={{ duration: 150 }}>
                <svelte:component this={$activeTab.component} />
            </div>
        {:else}
            <!-- Placeholder for features under development -->
            <div
                in:fly={{ 
                    duration: animationDuration, 
                    x: $slideDirection ? 100 : -100,
                    opacity: 0.2
                }}
                out:fade={{ duration: 150 }}>
                <PlaceholderTab icon={$activeTab.icon} title={$activeTab.title} />
            </div>
        {/if}
    {/key}
{/if}

<style>
    .sequenceWorkbenchContainer, .optionPickerContainer {
        flex: 1;
        position: relative; /* Added to ensure proper stacking */
    }
    
    .fullViewComponent {
        width: 100%;
        height: 100%;
        position: relative; /* Added to ensure proper stacking */
    }
    
    /* Responsive layouts */
    @media (orientation: portrait) {
        .sequenceWorkbenchContainer {
            flex: 2;
        }
        .optionPickerContainer {
            flex: 1;
        }
    }
    
    @media (orientation: landscape) {
        .sequenceWorkbenchContainer {
            width: 50%;
        }
        .optionPickerContainer {
            width: 50%;
        }
    }
</style>