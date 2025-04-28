// src/lib/components/ConstructTab/OptionPicker/utils/transitions.ts
import { cubicOut, quintOut } from 'svelte/easing';
import type { NavigationDirection } from '../store/navigationStore';
import { prefersReducedMotion } from './a11y';
import { get } from 'svelte/store';

type TransitionParams = {
    duration?: number;
    delay?: number;
    easing?: (t: number) => number;
};

type DirectionTransitionParams = TransitionParams & {
    direction?: NavigationDirection;
    distance?: number;
};

/**
 * Direction-aware transition that slides content based on navigation direction
 */
export function directionTransition(node: HTMLElement, params: DirectionTransitionParams = {}) {
    const {
        direction = 'initial',
        duration = 300,
        delay = 0,
        easing = cubicOut,
        distance = 30
    } = params;
    
    // Skip animations if user prefers reduced motion
    if (get(prefersReducedMotion)) {
        return {
            duration: 0,
            css: () => 'opacity: 1'
        };
    }
    
    // Determine the direction of movement
    const dx = direction === 'forward' ? distance : 
               direction === 'backward' ? -distance : 0;
    
    return {
        duration,
        delay,
        easing,
        css: (t: number, u: number) => `
            opacity: ${t};
            transform: translateX(${dx * u}px);
        `
    };
}

/**
 * Enhanced transition for empty states with subtle scale and blur
 */
export function emptyStateTransition(node: HTMLElement, params: TransitionParams = {}) {
    const {
        duration = 400,
        delay = 0,
        easing = quintOut
    } = params;
    
    // Skip animations if user prefers reduced motion
    if (get(prefersReducedMotion)) {
        return {
            duration: 0,
            css: () => 'opacity: 1'
        };
    }
    
    return {
        duration,
        delay,
        easing,
        css: (t: number) => `
            opacity: ${t};
            transform: scale(${0.92 + (0.08 * t)});
            filter: blur(${(1-t) * 2}px);
        `
    };
}

/**
 * Staggered grid item transition with natural timing
 */
export function staggeredItemTransition(node: HTMLElement, params: { index: number; total: number } & TransitionParams) {
    const {
        index,
        total,
        duration = 350,
        easing = quintOut
    } = params;
    
    // Skip animations if user prefers reduced motion
    if (get(prefersReducedMotion)) {
        return {
            duration: 0,
            css: () => 'opacity: 1'
        };
    }
    
    // Calculate a more natural stagger delay
    const baseDelay = Math.min(index * 30, 200);
    const spreadFactor = Math.sqrt(index) * 5;
    const groupSizeFactor = Math.log10(Math.max(total, 10)) * 10;
    const delay = Math.min(baseDelay + spreadFactor + groupSizeFactor, 250);
    
    return {
        duration,
        delay,
        easing,
        css: (t: number) => `
            opacity: ${t};
            transform: scale(${0.95 + (0.05 * t)});
        `
    };
}

/**
 * Transition for swipe gesture feedback
 */
export function swipeFeedbackTransition(node: HTMLElement, params: { percent: number; direction: 'left' | 'right' }) {
    const { percent, direction } = params;
    
    // Skip animations if user prefers reduced motion
    if (get(prefersReducedMotion)) {
        return {
            duration: 0,
            css: () => ''
        };
    }
    
    const sign = direction === 'left' ? -1 : 1;
    const translateX = sign * percent * 20; // Max 20px movement
    const opacity = 0.2 + (percent * 0.8); // Fade in as swipe progresses
    
    return {
        duration: 0, // Immediate update
        css: () => `
            opacity: ${opacity};
            transform: translateX(${translateX}px);
        `
    };
}
