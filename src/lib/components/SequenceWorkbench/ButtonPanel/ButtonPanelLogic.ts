import type { ButtonDefinition, ActionEventDetail } from './types';
import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';

/**
 * Defines the button panel buttons used in the sequence widget
 * @returns Array of button definitions
 */
export function getButtonPanelButtons(): ButtonDefinition[] {
    return [
        // Mode switching tools
        {
            icon: 'fa-hammer',
            title: 'Construct',
            id: 'constructMode',
            color: '#4361ee'
        },
        {
            icon: 'fa-robot',
            title: 'Generate',
            id: 'generateMode',
            color: '#3a86ff'
        },
        // Sharing and viewing tools
        { icon: 'fa-share-nodes', title: 'Share', id: 'saveImage', color: '#3a86ff' },
        { icon: 'fa-expand', title: 'Full Screen', id: 'viewFullScreen', color: '#4cc9f0' },
        // Sequence manipulation tools
        {
            icon: 'fa-arrows-left-right',
            title: 'Mirror',
            id: 'mirrorSequence',
            color: '#4895ef'
        },
        { icon: 'fa-paintbrush', title: 'Swap Colors', id: 'swapColors', color: '#ff6b6b' },
        { icon: 'fa-rotate', title: 'Rotate', id: 'rotateSequence', color: '#f72585' },
        // Dictionary tool
        {
            icon: 'fa-book-medical',
            title: 'Add to Dictionary',
            id: 'addToDictionary',
            color: '#4361ee'
        },
        // Destructive actions
        { icon: 'fa-trash', title: 'Delete Beat', id: 'deleteBeat', color: '#ff9e00' }
    ];
}

/**
 * Interface for the button action handler parameters
 */
export interface ButtonActionHandlerParams {
    id: string;
    activeMode: 'construct' | 'generate';
    setActiveMode: (mode: 'construct' | 'generate') => void;
    closeToolsPanel?: () => void;
    openFullScreen?: () => void;
}

/**
 * Handles button actions for the sequence widget
 * @param params Button action handler parameters
 */
export function handleButtonAction(params: ButtonActionHandlerParams): void {
    const { id, activeMode, setActiveMode, closeToolsPanel, openFullScreen } = params;
    
    switch (id) {
        case 'constructMode':
            // Switch to construct mode
            setActiveMode('construct');
            // Dispatch an event to notify parent components
            const constructEvent = new CustomEvent('switch-mode', {
                detail: { mode: 'construct' },
                bubbles: true
            });
            document.dispatchEvent(constructEvent);
            break;
        case 'generateMode':
            // Switch to generate mode
            setActiveMode('generate');
            // Dispatch an event to notify parent components
            const generateEvent = new CustomEvent('switch-mode', {
                detail: { mode: 'generate' },
                bubbles: true
            });
            document.dispatchEvent(generateEvent);
            break;
        case 'addToDictionary':
            // Handle add to dictionary action
            break;
        case 'saveImage':
            // Handle save image action
            break;
        case 'viewFullScreen':
            if (openFullScreen) {
                openFullScreen();
            }
            break;
        case 'mirrorSequence':
            // Handle mirror sequence action
            break;
        case 'swapColors':
            // Handle swap colors action
            break;
        case 'rotateSequence':
            // Handle rotate sequence action
            break;
        case 'deleteBeat':
            const selectedBeatIds = sequenceSelectors.selectedBeatIds();
            if (selectedBeatIds.length > 0) {
                sequenceActions.removeBeatAndFollowing(selectedBeatIds[0]);
            }
            break;
        case 'clearSequence':
            sequenceActions.clearSequence();
            // The clearSequence action now handles resetting the start position
            break;
    }
    
    // Close tools panel if it's open
    if (closeToolsPanel) {
        closeToolsPanel();
    }
}
