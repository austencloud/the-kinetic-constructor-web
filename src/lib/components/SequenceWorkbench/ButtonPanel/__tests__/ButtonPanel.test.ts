import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import ButtonPanel from '../ButtonPanel.svelte';
import * as ButtonPanelLogic from '../ButtonPanelLogic';

// Mock the button panel logic
vi.mock('../ButtonPanelLogic', () => ({
    handleButtonAction: vi.fn()
}));

// Mock the sequence overlay state
vi.mock('$lib/state/sequenceOverlay/sequenceOverlayState', () => ({
    openSequenceOverlay: vi.fn()
}));

// Mock the app actions
vi.mock('$lib/state/machines/app/app.actions', () => ({
    appActions: {
        openSettings: vi.fn()
    }
}));

// Mock the sequence actions
vi.mock('$lib/state/machines/sequenceMachine/actions', () => ({
    removeBeatAndFollowing: vi.fn()
}));

// Mock the sequence container
vi.mock('$lib/state/stores/sequence/SequenceContainer', () => ({
    sequenceContainer: {
        state: {
            selectedBeatIds: []
        }
    }
}));

describe('ButtonPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render all buttons', () => {
        const { container } = render(ButtonPanel, {
            props: {
                buttonSizeFactor: 1,
                beatFrameElement: null
            }
        });
        
        // Check that the button panel container is rendered
        const buttonPanel = container.querySelector('.button-panel');
        expect(buttonPanel).toBeTruthy();
    });

    it('should handle button actions', () => {
        render(ButtonPanel, {
            props: {
                buttonSizeFactor: 1,
                beatFrameElement: null
            }
        });
        
        // Create a custom event to simulate a button action
        const event = new CustomEvent('action', {
            detail: { id: 'clearSequence' }
        });
        
        // Dispatch the event
        document.dispatchEvent(event);
        
        // Check that the handleButtonAction function was called
        expect(ButtonPanelLogic.handleButtonAction).toHaveBeenCalled();
    });
});
