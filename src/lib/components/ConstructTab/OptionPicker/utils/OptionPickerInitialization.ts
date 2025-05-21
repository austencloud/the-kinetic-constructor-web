import { get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { SequenceBeat } from '$lib/services/SequenceDataService';
import { sequenceBeatToPictographData } from './TypeSafetyHelpers';

/**
 * Set up event listeners for the OptionPicker component
 */
export function setupEventListeners(
    handleSubTabSelect: (event: CustomEvent<string>) => void,
    handleViewChange: (event: CustomEvent<any>) => void
) {
    const optionPickerElement = document.querySelector('.option-picker');
    if (optionPickerElement) {
        // Listen for tabSelect events
        optionPickerElement.addEventListener('tabSelect', (event) => {
            if (event instanceof CustomEvent) {
                console.log('OptionPicker received tabSelect event:', event.detail);
                handleSubTabSelect(event as CustomEvent<string>);
            }
        });

        // Listen for both viewChange and optionPickerViewChange events
        optionPickerElement.addEventListener('viewChange', (event) => {
            if (event instanceof CustomEvent) {
                console.log('OptionPicker received viewChange event:', event.detail);
                handleViewChange(event as CustomEvent<any>);
            }
        });

        // Add listener for the new event name to avoid infinite recursion
        optionPickerElement.addEventListener('optionPickerViewChange', (event) => {
            if (event instanceof CustomEvent) {
                console.log('OptionPicker received optionPickerViewChange event:', event.detail);
                handleViewChange(event as CustomEvent<any>);
            }
        });
    }

    return optionPickerElement;
}

/**
 * Clean up event listeners when component is destroyed
 */
export function cleanupEventListeners(
    optionPickerElement: Element | null,
    handleSubTabSelect: (event: CustomEvent<string>) => void,
    handleViewChange: (event: CustomEvent<any>) => void
) {
    if (optionPickerElement) {
        optionPickerElement.removeEventListener('tabSelect', (event) => {
            if (event instanceof CustomEvent) {
                handleSubTabSelect(event as CustomEvent<string>);
            }
        });

        optionPickerElement.removeEventListener('viewChange', (event) => {
            if (event instanceof CustomEvent) {
                handleViewChange(event as CustomEvent<any>);
            }
        });

        // Also remove the new event listener
        optionPickerElement.removeEventListener('optionPickerViewChange', (event) => {
            if (event instanceof CustomEvent) {
                handleViewChange(event as CustomEvent<any>);
            }
        });
    }
}

/**
 * Load options from sequence data
 */
export function loadOptionsFromSequence(
    sequenceDataService: any,
    actions: any
) {
    // Get current sequence data
    const fullSequence = sequenceDataService.getCurrentSequence();

    // Find the start position beat (beat 0)
    const startPosBeat = fullSequence.find(
        (beat: any) =>
            beat && typeof beat === 'object' && 'beat' in beat && (beat as SequenceBeat).beat === 0
    ) as SequenceBeat | undefined;

    if (startPosBeat) {
        // Convert to PictographData with proper typing
        const pictographData = sequenceBeatToPictographData(startPosBeat);

        // Load options based on the pictograph data
        actions.loadOptions([pictographData]);
    } else {
        // No start position found, load empty options
        actions.loadOptions([]);
        console.log('No start position found in sequence data');
    }
}

/**
 * Initialize tab selection based on stored preferences
 */
export function initializeTabSelection(
    selectedTab: Writable<string | null>,
    groupedOptionsStore: Writable<Record<string, PictographData[]>>,
    uiState: Writable<any>,
    actions: any
) {
    setTimeout(() => {
        const currentGroups = get(groupedOptionsStore);
        const availableKeys = currentGroups ? Object.keys(currentGroups) : [];
        
        const savedState = get(uiState);
        const savedSortMethod = savedState.sortMethod;
        const lastSelectedTabsMap = savedState.lastSelectedTab;
        const preferredTabForSavedMethod = lastSelectedTabsMap[savedSortMethod];

        let initialTabToSet: string | null = 'all';
        if (preferredTabForSavedMethod) {
            if (preferredTabForSavedMethod === 'all') {
                initialTabToSet = 'all';
            } else if (availableKeys.includes(preferredTabForSavedMethod)) {
                initialTabToSet = preferredTabForSavedMethod;
            } else if (availableKeys.length > 0) {
                initialTabToSet = availableKeys[0];
            }
        } else if (availableKeys.length > 0) {
            initialTabToSet = availableKeys[0];
        }

        selectedTab.set(initialTabToSet);

        if (preferredTabForSavedMethod !== initialTabToSet) {
            actions.setLastSelectedTabForSort(savedSortMethod, initialTabToSet);
        }
    }, 0);
}

/**
 * Set up sequence update handlers
 */
export function setupSequenceUpdateHandlers(
    loadOptionsFromSequence: () => void,
    sequenceStore: any,
    actions: any
) {
    // Listen for sequence-updated events
    const handleSequenceUpdate = () => {
        loadOptionsFromSequence();
    };

    // Listen for refresh-options events (used when preserving start position after beat removal)
    const handleRefreshOptions = (event: CustomEvent) => {
        console.log('OptionPicker received refresh-options event:', event.detail);
        if (event.detail?.startPosition) {
            // Load options based on the provided start position
            actions.loadOptions([event.detail.startPosition]);
        } else {
            // Fallback to loading from sequence data
            loadOptionsFromSequence();
        }
    };

    document.addEventListener('sequence-updated', handleSequenceUpdate);
    document.addEventListener('refresh-options', handleRefreshOptions as EventListener);

    // Subscribe to the sequenceStore for updates
    const unsubscribeSequence = sequenceStore.subscribe((state: any) => {
        if (state && state.beats && state.beats.length > 0) {
            // Convert StoreBeatData to PictographData format
            const sequence = state.beats.map((beat: any) => {
                return {
                    letter: beat.metadata?.letter || null,
                    startPos: beat.metadata?.startPos || null,
                    endPos: beat.metadata?.endPos || null,
                    redPropData: beat.redPropData,
                    bluePropData: beat.bluePropData,
                    // Convert motion data from the store format
                    redMotionData: beat.redMotionData || null,
                    blueMotionData: beat.blueMotionData || null
                } as PictographData;
            });
            actions.loadOptions(sequence);
        }
    });

    return {
        handleSequenceUpdate,
        handleRefreshOptions,
        unsubscribeSequence
    };
}

/**
 * Clean up sequence update handlers
 */
export function cleanupSequenceUpdateHandlers(
    handleSequenceUpdate: () => void,
    handleRefreshOptions: EventListener,
    unsubscribeSequence: () => void
) {
    document.removeEventListener('sequence-updated', handleSequenceUpdate);
    document.removeEventListener('refresh-options', handleRefreshOptions);
    unsubscribeSequence();
}
