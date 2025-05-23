<!-- src/lib/components/objects/Arrow/ArrowDebuggerSetup.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { startArrowMonitoring, logArrowLifecycle } from './ArrowDebugger';
    
    // Props
    const props = $props<{
        componentId: string;
        componentState: any;
    }>();
    
    // Set up monitoring
    let stopMonitoring: (() => void) | null = null;
    
    // Set up a $effect to track state changes
    $effect(() => {
        // This will run whenever componentState changes
        if (props.componentState) {
            console.debug(`[ArrowDebugger] State update for ${props.componentId}:`, {
                isLoaded: props.componentState.isLoaded,
                hasCalledLoaded: props.componentState.hasCalledLoaded,
                isInitialized: props.componentState.isInitialized,
                isLoadingStarted: props.componentState.isLoadingStarted,
                hasSvgData: !!props.componentState.svgData
            });
        }
    });
    
    // Start monitoring on mount
    onMount(() => {
        // Log component mounting
        logArrowLifecycle(props.componentId, 'mounted');
        
        // Start monitoring for infinite loops
        stopMonitoring = startArrowMonitoring(props.componentId);
    });
    
    // Clean up on destroy
    onDestroy(() => {
        // Log component unmounting
        logArrowLifecycle(props.componentId, 'unmounted');
        
        // Stop monitoring
        if (stopMonitoring) {
            stopMonitoring();
            stopMonitoring = null;
        }
    });
</script>

<!-- This is a utility component with no visual output -->
