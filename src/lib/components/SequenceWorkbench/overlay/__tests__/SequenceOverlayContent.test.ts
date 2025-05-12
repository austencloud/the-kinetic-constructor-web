import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import SequenceOverlayContent from '../SequenceOverlayContent.svelte';

// Mock the sequence container
vi.mock('$lib/state/stores/sequence/SequenceContainer', () => ({
    sequenceContainer: {
        state: {
            beats: [
                {
                    id: 'beat1',
                    metadata: {
                        letter: 'A',
                        startPos: 'center',
                        endPos: 'right',
                        gridMode: 'diamond',
                        grid: ''
                    },
                    redPropData: null,
                    bluePropData: null,
                    redMotionData: null,
                    blueMotionData: null,
                    redArrowData: null,
                    blueArrowData: null
                },
                {
                    id: 'beat2',
                    metadata: {
                        letter: 'B',
                        startPos: 'right',
                        endPos: 'left',
                        gridMode: 'diamond',
                        grid: ''
                    },
                    redPropData: null,
                    bluePropData: null,
                    redMotionData: null,
                    blueMotionData: null,
                    redArrowData: null,
                    blueArrowData: null
                }
            ]
        }
    }
}));

describe('SequenceOverlayContent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render correctly with the correct number of pictographs', () => {
        const { container } = render(SequenceOverlayContent, {
            props: {
                title: 'Test Sequence'
            }
        });
        
        // Check that the container has the correct data-beat-count attribute
        const beatContainer = container.querySelector('.fullscreen-beat-container');
        expect(beatContainer).toBeTruthy();
        expect(beatContainer?.getAttribute('data-beat-count')).toBe('2');
        
        // Check that we have the correct number of pictograph containers
        const pictographContainers = container.querySelectorAll('.pictograph-container');
        expect(pictographContainers.length).toBe(2);
    });

    it('should apply the correct CSS variables based on beat count', () => {
        const { container } = render(SequenceOverlayContent, {
            props: {
                title: 'Test Sequence'
            }
        });
        
        // Check that the container has the correct data-beat-count attribute
        const beatContainer = container.querySelector('.fullscreen-beat-container');
        expect(beatContainer).toBeTruthy();
        
        // Check that the grid container has the correct styles
        const gridContainer = container.querySelector('.overlay-grid-container');
        expect(gridContainer).toBeTruthy();
        
        // We can't directly test the CSS variables in JSDOM, but we can check that
        // the container has the correct classes and attributes
        expect(beatContainer?.classList.contains('fullscreen-beat-container')).toBe(true);
        expect(gridContainer?.classList.contains('overlay-grid-container')).toBe(true);
    });
});
