import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SequenceWidget from '../SequenceWidget.svelte';
import * as LayoutCalculator from '../utils/SequenceLayoutCalculator';

// Mock the layout calculator functions
vi.mock('../utils/SequenceLayoutCalculator', () => ({
    calculateWorkbenchIsPortrait: vi.fn().mockReturnValue(false),
    calculateButtonSizeFactor: vi.fn().mockReturnValue(1.0),
    calculateBeatFrameShouldScroll: vi.fn().mockReturnValue(false),
    calculateCombinedUnitHeight: vi.fn().mockReturnValue(400),
    calculateAvailableHeightForBeatFrame: vi.fn().mockReturnValue(500)
}));

// Mock the resize observer
vi.mock('$lib/composables/useResizeObserver', () => ({
    useResizeObserver: vi.fn().mockReturnValue({
        size: { width: 1000, height: 800 },
        resizeObserver: vi.fn()
    })
}));

// Mock the responsive layout hook
vi.mock('$lib/composables/useResponsiveLayout', () => ({
    useResponsiveLayout: vi.fn().mockReturnValue({
        dimensions: { width: 1000, height: 800 }
    })
}));

// Mock the sequence container
vi.mock('$lib/state/stores/sequence/SequenceContainer', () => ({
    sequenceContainer: {
        state: {
            beats: [],
            selectedBeatIds: []
        }
    }
}));

describe('SequenceWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render correctly', () => {
        const { container } = render(SequenceWidget);
        expect(container).toBeTruthy();
    });

    it('should use the layout calculator functions', () => {
        render(SequenceWidget);
        
        // Check that the layout calculator functions were called
        expect(LayoutCalculator.calculateWorkbenchIsPortrait).toHaveBeenCalled();
        expect(LayoutCalculator.calculateButtonSizeFactor).toHaveBeenCalled();
        
        // The calculateBeatFrameShouldScroll function is called in an effect,
        // so we need to wait for it to be called
        setTimeout(() => {
            expect(LayoutCalculator.calculateBeatFrameShouldScroll).toHaveBeenCalled();
        }, 0);
    });

    it('should apply the correct CSS classes based on scroll state', async () => {
        // Mock the calculateBeatFrameShouldScroll function to return true
        vi.mocked(LayoutCalculator.calculateBeatFrameShouldScroll).mockReturnValue(true);
        
        const { container } = render(SequenceWidget);
        
        // Wait for the effect to run
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Check that the scroll-mode-active class is applied
        const contentWrapper = container.querySelector('.content-wrapper');
        expect(contentWrapper?.classList.contains('scroll-mode-active')).toBe(true);
        
        const beatFrameWrapper = container.querySelector('.beat-frame-wrapper');
        expect(beatFrameWrapper?.classList.contains('scroll-mode-active')).toBe(true);
    });
});
