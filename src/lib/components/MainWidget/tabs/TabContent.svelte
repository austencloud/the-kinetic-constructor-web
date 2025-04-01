<!-- src/lib/components/MainWidget/tabs/TabContent.svelte -->
<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { activeTab, slideDirection, tabs } from '../state/appState';
    import { selectedStartPos } from '$lib/stores/constructStores';
    import PlaceholderTab from './PlaceholderTab.svelte';
    import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
    import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
    import StartPosPicker from '$lib/components/StartPosPicker/StartPosPicker.svelte';
    
    export let isVisible: boolean = true;
</script>

<!-- Use key to force re-render on tab change -->
{#if isVisible}
    {#key $activeTab.id}
        {#if $activeTab.splitView}
            <!-- Split view layout for sequence workbench -->
            <div
                class="sequenceWorkbenchContainer"
                in:fly={{ 
                    duration: 500, 
                    x: $slideDirection ? 100 : -100 
                }}
                out:fly={{ 
                    duration: 400, 
                    x: $slideDirection ? -100 : 100 
                }}
            >
                <SequenceWorkbench />
            </div>

            <div
                class="optionPickerContainer"
                in:fly={{ 
                    duration: 500, 
                    delay: 200, 
                    x: $slideDirection ? 100 : -100 
                }}
                out:fly={{ 
                    duration: 400, 
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
                    duration: 500, 
                    x: $slideDirection ? 100 : -100,
                    opacity: 0.2
                }}
                out:fade={{ duration: 300 }}
            >
                <svelte:component this={$activeTab.component} />
            </div>
        {:else}
            <!-- Placeholder for features under development -->
            <div
                in:fly={{ 
                    duration: 500, 
                    x: $slideDirection ? 100 : -100,
                    opacity: 0.2
                }}
                out:fade={{ duration: 300 }}
            >
                <PlaceholderTab icon={$activeTab.icon} title={$activeTab.title} />
            </div>
        {/if}
    {/key}
{/if}

<style>
    .sequenceWorkbenchContainer, .optionPickerContainer {
        flex: 1;
    }
    
    .fullViewComponent {
        width: 100%;
        height: 100%;
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