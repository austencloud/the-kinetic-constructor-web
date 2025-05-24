<!-- src/lib/components/objects/Arrow/ArrowDebuggerSetup.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { startArrowMonitoring, logArrowLifecycle } from './ArrowDebugger';
    
    const props = $props<{
        componentId: string;
        componentState: any;
    }>();
    
    let stopMonitoring: (() => void) | null = null;
    
    onMount(() => {
        logArrowLifecycle(props.componentId, 'mounted');
        stopMonitoring = startArrowMonitoring(props.componentId);
    });
    
    onDestroy(() => {
        logArrowLifecycle(props.componentId, 'unmounted');
        
        if (stopMonitoring) {
            stopMonitoring();
            stopMonitoring = null;
        }
    });
</script>

<!-- This is a utility component with no visual output -->
