/**
 * EFFECT TRACKER - Precise Svelte 5 Effect Monitoring
 * Tracks every $effect execution to identify infinite loops
 */

interface EffectExecution {
    id: string;
    component: string;
    effectName: string;
    timestamp: number;
    stackTrace: string;
    data?: any;
    executionCount: number;
}

class EffectTracker {
    private executions: Map<string, EffectExecution> = new Map();
    private recentExecutions: EffectExecution[] = [];
    private maxRecentExecutions = 100;
    private loopThreshold = 10; // Effects firing more than this in 100ms = loop
    private loopDetected = false;

    trackEffect(component: string, effectName: string, data?: any): void {
        const timestamp = Date.now();
        const id = `${component}-${effectName}`;
        const stackTrace = new Error().stack?.split('\n').slice(2, 5).join('\n') || '';

        // Update execution count
        const existing = this.executions.get(id);
        const executionCount = existing ? existing.executionCount + 1 : 1;

        const execution: EffectExecution = {
            id,
            component,
            effectName,
            timestamp,
            stackTrace,
            data,
            executionCount
        };

        this.executions.set(id, execution);
        this.recentExecutions.push(execution);

        // Keep recent executions manageable
        if (this.recentExecutions.length > this.maxRecentExecutions) {
            this.recentExecutions.shift();
        }

        // Check for infinite loops
        this.checkForLoops(execution);

        // Log the effect
        console.log(`🔍 [${component}] ${effectName} (${executionCount}x)`, data);
    }

    private checkForLoops(currentExecution: EffectExecution): void {
        if (this.loopDetected) return;

        const now = currentExecution.timestamp;
        const recentWindow = 100; // 100ms window

        // Get recent executions of the same effect
        const recentSameEffect = this.recentExecutions.filter(
            exec => exec.id === currentExecution.id && 
                   now - exec.timestamp < recentWindow
        );

        if (recentSameEffect.length >= this.loopThreshold) {
            this.loopDetected = true;
            this.reportLoop(currentExecution, recentSameEffect);
        }

        // Also check for cross-component loops
        const allRecentEffects = this.recentExecutions.filter(
            exec => now - exec.timestamp < recentWindow
        );

        if (allRecentEffects.length >= 20) {
            this.reportPossibleCrossComponentLoop(allRecentEffects);
        }
    }

    private reportLoop(execution: EffectExecution, recentExecutions: EffectExecution[]): void {
        console.error('🚨🚨🚨 INFINITE LOOP DETECTED! 🚨🚨🚨');
        console.error(`Component: ${execution.component}`);
        console.error(`Effect: ${execution.effectName}`);
        console.error(`Executions in 100ms: ${recentExecutions.length}`);
        console.error(`Total executions: ${execution.executionCount}`);
        console.error('Stack trace:', execution.stackTrace);
        console.error('Recent executions:', recentExecutions);
        
        // Trigger debugger
        debugger;
    }

    private reportPossibleCrossComponentLoop(recentExecutions: EffectExecution[]): void {
        console.warn('⚠️ POSSIBLE CROSS-COMPONENT LOOP DETECTED');
        console.warn(`${recentExecutions.length} effects fired in 100ms`);
        
        const componentCounts = recentExecutions.reduce((acc, exec) => {
            acc[exec.component] = (acc[exec.component] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        console.warn('Component execution counts:', componentCounts);
        console.warn('Recent executions:', recentExecutions.slice(-10));
    }

    getReport() {
        return {
            totalEffects: this.executions.size,
            totalExecutions: Array.from(this.executions.values()).reduce(
                (sum, exec) => sum + exec.executionCount, 0
            ),
            loopDetected: this.loopDetected,
            topExecutors: Array.from(this.executions.values())
                .sort((a, b) => b.executionCount - a.executionCount)
                .slice(0, 10),
            recentExecutions: this.recentExecutions.slice(-20)
        };
    }

    reset(): void {
        this.executions.clear();
        this.recentExecutions = [];
        this.loopDetected = false;
    }
}

// Global instance
export const effectTracker = new EffectTracker();

// Helper function to track effects in components
export function trackEffect(component: string, effectName: string, data?: any): void {
    effectTracker.trackEffect(component, effectName, data);
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
    (window as any).effectTracker = effectTracker;
}
