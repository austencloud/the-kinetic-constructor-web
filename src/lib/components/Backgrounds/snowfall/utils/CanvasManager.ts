import { get } from 'svelte/store';
import { dimensions } from '../store';

export const createCanvasManager = () => {
    // References
    let canvas: HTMLCanvasElement | null = null;
    let resizeTimeout: number | null = null;
    let resizeCallback: (() => void) | null = null;
    
    /**
     * Initialize the canvas manager
     * @param canvasElement The canvas element to manage
     * @param onResize Optional callback to execute after resize
     */
    const initialize = (canvasElement: HTMLCanvasElement, onResize?: () => void): void => {
        canvas = canvasElement;
        
        if (onResize) {
            resizeCallback = onResize;
        }
        
        // Check for browser environment
        if (typeof window === 'undefined') return;
        
        // Set initial dimensions
        const initialWidth = window.innerWidth;
        const initialHeight = window.innerHeight;
        
        dimensions.set({ 
            width: initialWidth, 
            height: initialHeight 
        });
        
        canvas.width = initialWidth;
        canvas.height = initialHeight;
        
        // Add resize listener
        window.addEventListener('resize', handleResize);
        
        // Listen for visibility changes to save resources when tab is hidden
        document.addEventListener('visibilitychange', handleVisibilityChange);
    };
    
    /**
     * Handle window resize event with debounce
     */
    const handleResize = (): void => {
        if (!canvas) return;
        
        // Check for browser environment
        if (typeof window === 'undefined') return;
        
        // Debounce resize events
        if (resizeTimeout) {
            cancelAnimationFrame(resizeTimeout);
        }
        
        resizeTimeout = requestAnimationFrame(() => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            
            // Update canvas dimensions
            canvas!.width = newWidth;
            canvas!.height = newHeight;
            
            // Update store
            dimensions.set({ width: newWidth, height: newHeight });
            
            // Execute resize callback if provided
            if (resizeCallback) {
                resizeCallback();
            }
        });
    };
    
    /**
     * Handle visibility change event to pause animations when tab is hidden
     */
    const handleVisibilityChange = (): void => {
        // Implementation handled by the isActive store in the main component
    };
    
    /**
     * Clean up event listeners and resources
     */
    const cleanup = (): void => {
        if (typeof window === 'undefined') return;
        
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        if (resizeTimeout) {
            cancelAnimationFrame(resizeTimeout);
        }
        
        canvas = null;
        resizeCallback = null;
    };
    
    return {
        initialize,
        handleResize,
        cleanup
    };
};