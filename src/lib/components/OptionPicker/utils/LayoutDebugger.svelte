<script lang="ts">
    import { getContext } from 'svelte';
    import { fade } from 'svelte/transition';
    import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
    import { activeLayoutRule } from '../utils/layoutUtils';

    let showInfo = false;
    let buttonTimeout: ReturnType<typeof setTimeout> | null = null;
    const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);

    function toggleInfo() {
        showInfo = !showInfo;
        
        if (showInfo && buttonTimeout === null) {
            buttonTimeout = setTimeout(() => {
                showInfo = false;
                buttonTimeout = null;
            }, 5000);
        } else if (!showInfo && buttonTimeout !== null) {
            clearTimeout(buttonTimeout);
            buttonTimeout = null;
        }
    }
</script>

<div class="debug-button-container">
    <button 
        class="debug-layout-button" 
        on:click={toggleInfo} 
        title="Show current layout rule"
    >
        📐
    </button>
    
    {#if showInfo}
        <div class="debug-info" transition:fade={{ duration: 200 }}>
            <div class="rule-card">
                <h3>Active Layout Rule:</h3>
                {#if $activeLayoutRule}
                    <div class="rule-info">
                        <span class="rule-desc">{$activeLayoutRule.description}</span>
                        <div class="rule-details">
                            <div class="columns">Columns: <b>{$activeLayoutRule.columns}</b></div>
                            {#if $activeLayoutRule.maxColumns}
                                <div class="max-cols">(Max: {$activeLayoutRule.maxColumns})</div>
                            {/if}
                        </div>
                        <div class="conditions">
                            Conditions:
                            <ul>
                                {#if $activeLayoutRule.when.count !== undefined}
                                    <li>Count: {$activeLayoutRule.when.count}</li>
                                {/if}
                                {#if $activeLayoutRule.when.minCount !== undefined}
                                    <li>Min Count: {$activeLayoutRule.when.minCount}</li>
                                {/if}
                                {#if $activeLayoutRule.when.device}
                                    <li>Device: {$activeLayoutRule.when.device}</li>
                                {/if}
                                {#if $activeLayoutRule.when.aspect}
                                    <li>Aspect: {$activeLayoutRule.when.aspect}</li>
                                {/if}
                                {#if $activeLayoutRule.when.aspects}
                                    <li>Aspects: {$activeLayoutRule.when.aspects.join(", ")}</li>
                                {/if}
                                {#if $activeLayoutRule.when.orientation}
                                    <li>Orientation: {$activeLayoutRule.when.orientation}</li>
                                {/if}
                                {#if $activeLayoutRule.when.extraCheck}
                                    <li>Has extra check condition</li>
                                {/if}
                            </ul>
                        </div>
                    </div>
                    <div class="current-state">
                        <div class="state-header">Current State:</div>
                        <ul>
                            <li>Count: {$layoutContext.layoutConfig.gridColumns.match(/repeat\((\d+)/)?.[1] || 'unknown'} columns</li>
                            <li>Device: {$layoutContext.deviceType} ({$layoutContext.isMobile ? 'mobile' : 'desktop'})</li>
                            <li>Aspect: {$layoutContext.containerAspect}</li>
                            <li>Orientation: {$layoutContext.isPortrait ? 'portrait' : 'landscape'}</li>
                            <li>Size: {$layoutContext.containerWidth}×{$layoutContext.containerHeight}</li>
                        </ul>
                    </div>
                    <div class="edit-tip">
                        Edit in: <code>src/lib/components/OptionPicker/utils/layoutConfig.ts</code>
                    </div>
                {:else}
                    <div class="no-rule">No layout rule currently matched.</div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .debug-button-container {
        position: absolute;
        bottom: 10px;
        left: 10px;
        z-index: 1000;
    }
    
    .debug-layout-button {
        background: #1e293b;
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: all 0.2s ease;
    }
    
    .debug-layout-button:hover {
        opacity: 1;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
    }
    
    .debug-info {
        position: absolute;
        bottom: 40px;
        left: 0;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 8px;
        width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-family: ui-monospace, monospace;
        font-size: 12px;
        line-height: 1.4;
        overflow: hidden;
    }
    
    .rule-card {
        padding: 12px;
    }
    
    h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #38bdf8;
        border-bottom: 1px solid #334155;
        padding-bottom: 5px;
    }
    
    .rule-info {
        margin-bottom: 12px;
    }
    
    .rule-desc {
        display: block;
        font-weight: 600;
        color: #94a3b8;
        margin-bottom: 8px;
    }
    
    .rule-details {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }
    
    .columns {
        color: #38bdf8;
    }
    
    .max-cols {
        color: #94a3b8;
        font-size: 11px;
    }
    
    .conditions {
        font-size: 11px;
        margin-top: 5px;
    }
    
    .conditions ul {
        margin: 4px 0 0 0;
        padding-left: 16px;
    }
    
    .conditions li {
        margin: 2px 0;
    }
    
    .current-state {
        background: #1e293b;
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 10px;
        font-size: 11px;
    }
    
    .state-header {
        font-weight: 600;
        color: #38bdf8;
        margin-bottom: 4px;
    }
    
    .current-state ul {
        margin: 0;
        padding-left: 16px;
    }
    
    .current-state li {
        margin: 2px 0;
    }
    
    .edit-tip {
        font-size: 10px;
        color: #94a3b8;
        border-top: 1px solid #334155;
        padding-top: 6px;
    }
    
    .edit-tip code {
        background: #334155;
        padding: 2px 4px;
        border-radius: 3px;
        color: #38bdf8;
    }
    
    .no-rule {
        padding: 10px;
        color: #fb7185;
        font-style: italic;
    }
</style>
