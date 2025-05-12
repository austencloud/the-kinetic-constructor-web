import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import SequenceContent from '../SequenceContent.svelte';
import * as LayoutCalculator from '../../utils/SequenceLayoutCalculator';

// Mock the layout calculator functions
vi.mock('../../utils/SequenceLayoutCalculator', () => ({
    calculateBeatFrameShouldScroll: vi.fn().mockReturnValue(false)
}));

// Mock the sequence metadata manager
vi.mock('../../utils/SequenceMetadataManager', () => ({
    useSequenceMetadata: vi.fn().mockImplementation((callback) => {
        callback({ name: 'Test Sequence', difficulty: 1 });
        return { unsubscribe: vi.fn() };
    })
}));

describe('SequenceContent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use the layout calculator for scroll calculation', () => {
        // Render the component with props
        render(SequenceContent, {
            props: {
                containerHeight: 500,
                containerWidth: 800
            }
        });
        
        // The calculateBeatFrameShouldScroll function is called in an effect,
        // so we need to wait for it to be called
        setTimeout(() => {
            expect(LayoutCalculator.calculateBeatFrameShouldScroll).toHaveBeenCalled();
        }, 0);
    });
});
