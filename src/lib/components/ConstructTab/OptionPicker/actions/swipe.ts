// src/lib/components/ConstructTab/OptionPicker/actions/swipe.ts
import { prefersReducedMotion } from '../utils/a11y';
import { get } from 'svelte/store';

export interface SwipeOptions {
    threshold?: number;
    onLeft?: () => void;
    onRight?: () => void;
    preventScroll?: boolean;
    minDistance?: number;
    maxTime?: number;
}

/**
 * Svelte action for handling swipe gestures
 * @param node The DOM element to attach the swipe action to
 * @param parameters Configuration options for the swipe behavior
 */
export function swipe(node: HTMLElement, parameters: SwipeOptions = {}) {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isDragging = false;
    let currentX = 0;
    
    // Configurable options with defaults
    let options: Required<SwipeOptions> = {
        threshold: 50,
        onLeft: () => {},
        onRight: () => {},
        preventScroll: true,
        minDistance: 10, // Minimum distance to consider as a swipe
        maxTime: 300, // Maximum time in ms for a valid swipe
        ...parameters
    };
    
    function handleStart(event: TouchEvent | MouseEvent) {
        // Skip if reduced motion is preferred
        if (get(prefersReducedMotion)) return;
        
        isDragging = true;
        startTime = Date.now();
        
        const touch = 'touches' in event ? event.touches[0] : event;
        startX = touch.clientX;
        startY = touch.clientY;
        currentX = startX;
        
        // Dispatch event for visual feedback on gesture start
        node.dispatchEvent(new CustomEvent('swipestart', { 
            detail: { x: startX, y: startY } 
        }));
    }
    
    function handleMove(event: TouchEvent | MouseEvent) {
        if (!isDragging) return;
        
        const touch = 'touches' in event ? event.touches[0] : event;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        currentX = touch.clientX;
        
        // If more horizontal than vertical motion and past minimum threshold, prevent scrolling
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > options.minDistance && options.preventScroll) {
            event.preventDefault();
        }
        
        // Calculate percentage of threshold reached (capped at 100%)
        const percentComplete = Math.min(Math.abs(dx) / options.threshold, 1);
        const direction = dx > 0 ? 'right' : 'left';
        
        // Dispatch event for visual feedback during swipe
        node.dispatchEvent(new CustomEvent('swipemove', { 
            detail: { dx, dy, percentComplete, direction } 
        }));
    }
    
    function handleEnd(event: TouchEvent | MouseEvent) {
        if (!isDragging) return;
        isDragging = false;
        
        const dx = currentX - startX;
        const swipeTime = Date.now() - startTime;
        
        // Check if swipe meets criteria (distance threshold and time constraint)
        if (Math.abs(dx) >= options.threshold && swipeTime <= options.maxTime) {
            if (dx > 0) {
                options.onRight();
            } else {
                options.onLeft();
            }
        }
        
        node.dispatchEvent(new CustomEvent('swipeend'));
    }
    
    function handleCancel() {
        if (isDragging) {
            isDragging = false;
            node.dispatchEvent(new CustomEvent('swipeend'));
        }
    }
    
    // Add event listeners
    node.addEventListener('touchstart', handleStart, { passive: true });
    node.addEventListener('touchmove', handleMove, { passive: !options.preventScroll });
    node.addEventListener('touchend', handleEnd);
    node.addEventListener('touchcancel', handleCancel);
    
    // Add mouse event listeners for desktop testing
    node.addEventListener('mousedown', handleStart);
    node.addEventListener('mousemove', handleMove);
    node.addEventListener('mouseup', handleEnd);
    node.addEventListener('mouseleave', handleCancel);
    
    return {
        destroy() {
            // Clean up event listeners
            node.removeEventListener('touchstart', handleStart);
            node.removeEventListener('touchmove', handleMove);
            node.removeEventListener('touchend', handleEnd);
            node.removeEventListener('touchcancel', handleCancel);
            
            node.removeEventListener('mousedown', handleStart);
            node.removeEventListener('mousemove', handleMove);
            node.removeEventListener('mouseup', handleEnd);
            node.removeEventListener('mouseleave', handleCancel);
        },
        update(newParams: SwipeOptions) {
            options = { ...options, ...newParams };
        }
    };
}
