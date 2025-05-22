<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/TabsInnerContainer.svelte -->
<script lang="ts">
    import TabButton from './TabButton.svelte';

    // Props
    const props = $props<{
        categoryKeys: string[];
        selectedTab: string | null;
        useShortLabels: boolean;
    }>();
</script>

<div class="tabs-inner-container">
    {#each props.categoryKeys as categoryKey, index (categoryKey)}
        <TabButton
            {categoryKey}
            isActive={String(props.selectedTab) === String(categoryKey)}
            isFirstTab={index === 0}
            isLastTab={index === props.categoryKeys.length - 1}
            useShortLabels={props.useShortLabels}
            tabFlexBasis={`${100 / props.categoryKeys.length}%`}
            {index}
            totalTabs={props.categoryKeys.length}
        />
    {/each}
</div>

<style>
    .tabs-inner-container {
        display: flex; /* Make this a flex container */
        width: 100%; /* Make it take the full width of .tabs */
        min-width: max-content; /* Ensure it's wide enough for all tabs if not scrollable */
        gap: 4px;
        padding: 0 4px;
        /* Ensure inner container doesn't clip borders */
        margin: 0 -2px; /* Compensate for tabs padding */
        position: relative; /* For tooltip positioning */
    }

    /* Mobile styles */
    @media (max-width: 640px) {
        /* Reduce gap between tabs */
        .tabs-inner-container {
            gap: 2px;
        }
    }

    /* Very small screens */
    @media (max-width: 480px) {
        /* Further reduce gap between tabs */
        .tabs-inner-container {
            gap: 1px;
        }
    }
</style>
