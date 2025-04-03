// src/lib/services/SequenceDataService.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Constants
const DIAMOND = 'diamond';

// Define the sequence metadata structure
export interface SequenceMetadata {
    word: string;
    author: string;
    level: number;
    prop_type: string;
    grid_mode: string;
    is_circular: boolean;
    can_be_CAP: boolean;
    is_strict_rotated_CAP: boolean;
    is_strict_mirrored_CAP: boolean;
    is_strict_swapped_CAP: boolean;
    is_mirrored_swapped_CAP: boolean;
    is_rotated_swapped_CAP: boolean;
}

// Define the beat structure
export interface SequenceBeat {
    beat?: number;
    letter?: string;
    letter_type?: string;
    duration?: number;
    start_pos?: string;
    end_pos?: string;
    timing?: string;
    direction?: string;
    is_placeholder?: boolean;
    blue_attributes: {
        motion_type: string;
        start_ori: string;
        prop_rot_dir: string;
        start_loc: string;
        end_loc: string;
        turns: number | 'fl';
        end_ori?: string;
    };
    red_attributes: {
        motion_type: string;
        start_ori: string;
        prop_rot_dir: string;
        start_loc: string;
        end_loc: string;
        turns: number | 'fl';
        end_ori?: string;
    };
}

class SequenceDataService {
    private currentSequenceJsonPath = '/current_sequence.json';

    // Default metadata for a new sequence
    private defaultMetadata: SequenceMetadata = {
        word: '',
        author: '',
        level: 0,
        prop_type: '',
        grid_mode: DIAMOND,
        is_circular: false,
        can_be_CAP: false,
        is_strict_rotated_CAP: false,
        is_strict_mirrored_CAP: false,
        is_strict_swapped_CAP: false,
        is_mirrored_swapped_CAP: false,
        is_rotated_swapped_CAP: false
    };

    // Store for the current sequence
    private sequenceStore = writable<(SequenceMetadata | SequenceBeat)[]>([
        this.defaultMetadata
    ]);

    constructor() {
        this.loadSequence();
    }

    // Load sequence from JSON file
    async loadSequence() {
        if (!browser) return;

        try {
            const response = await fetch(this.currentSequenceJsonPath);
            
            if (!response.ok) {
                // If file doesn't exist, create default sequence
                await this.saveSequence([this.defaultMetadata]);
                return;
            }

            const sequence = await response.json();
            
            // Ensure we always have metadata at index 0
            if (!sequence[0] || !('word' in sequence[0])) {
                sequence.unshift(this.defaultMetadata);
            }

            this.sequenceStore.set(sequence);
        } catch (error) {
            console.error('Error loading sequence:', error);
            await this.saveSequence([this.defaultMetadata]);
        }
    }

    // Save sequence to JSON file
    async saveSequence(sequence?: (SequenceMetadata | SequenceBeat)[]) {
        if (!browser) return;

        try {
            // Use provided sequence or current sequence
            const sequenceToSave = sequence || this.getCurrentSequence();

            // Ensure metadata exists
            if (!sequenceToSave[0] || !('word' in sequenceToSave[0])) {
                sequenceToSave.unshift(this.defaultMetadata);
            }

            // Recalculate metadata
            const metadata = sequenceToSave[0] as SequenceMetadata;
            metadata.word = this.recalculateWord(sequenceToSave);
            metadata.is_circular = this.checkIsCircular(sequenceToSave);
            metadata.can_be_CAP = this.checkCanBeCAP(sequenceToSave);

            // Add beat numbers
            this.assignBeatNumbers(sequenceToSave);

            // Save to file
            const response = await fetch(this.currentSequenceJsonPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sequenceToSave, null, 2)
            });

            if (!response.ok) {
                throw new Error('Failed to save sequence');
            }

            // Update the store
            this.sequenceStore.set(sequenceToSave);
        } catch (error) {
            console.error('Error saving sequence:', error);
        }
    }

    // Assign beat numbers sequentially
    private assignBeatNumbers(sequence: (SequenceMetadata | SequenceBeat)[]) {
        const beats = sequence.slice(1);
        beats.forEach((beat, index) => {
            (beat as SequenceBeat).beat = index;
        });
    }

    // Add a new beat to the sequence
    async addBeat(beat: SequenceBeat) {
        const currentSequence = this.getCurrentSequence();
        
        // Ensure beat number is sequential
        const beats = currentSequence.slice(1);
        const maxBeat = beats.reduce((max, item) => 
            Math.max(max, (item as SequenceBeat).beat ?? -1), -1);
        
        beat.beat = maxBeat + 1;
        
        // Add the beat
        currentSequence.push(beat);
        
        // Save the updated sequence
        await this.saveSequence(currentSequence);
    }

    // Add start position to the sequence
    async addStartPosition(startPos: SequenceBeat) {
        const currentSequence = this.getCurrentSequence();

        // Check if a start position already exists
        const existingStartPosIndex = currentSequence.slice(1).findIndex(beat => 
            (beat as SequenceBeat).beat === 0
        );

        // If a start position exists, replace it
        if (existingStartPosIndex !== -1) {
            currentSequence[existingStartPosIndex + 1] = {
                ...startPos,
                beat: 0
            };
        } else {
            // Add the start position to the sequence
            startPos.beat = 0;
            currentSequence.splice(1, 0, startPos);
        }

        // Save the updated sequence
        await this.saveSequence(currentSequence);
    }

    // Get the current sequence
    getCurrentSequence() {
        let sequence: (SequenceMetadata | SequenceBeat)[] = [];
        this.sequenceStore.subscribe(value => {
            sequence = value;
        })();
        return sequence;
    }

    // Get the sequence store for reactive updates
    getSequenceStore() {
        return this.sequenceStore;
    }

    // Recalculate word from sequence beats
    private recalculateWord(sequence: (SequenceMetadata | SequenceBeat)[]): string {
        return sequence
            .slice(1)
            .filter(beat => 'letter' in beat && beat.letter)
            .map(beat => (beat as SequenceBeat).letter)
            .join('');
    }

    // Check if sequence ends at start position
    private checkIsCircular(sequence: (SequenceMetadata | SequenceBeat)[]): boolean {
        if (sequence.length <= 1) return false;
        
        const beats = sequence.slice(1);
        
        // Find the last non-placeholder beat
        const lastBeat = beats.slice().reverse().find(beat => 
            !(beat as SequenceBeat).is_placeholder
        ) as SequenceBeat | undefined;
        
        const startBeat = beats.find(beat => 
            (beat as SequenceBeat).beat === 0
        ) as SequenceBeat | undefined;
        
        // Check if the last beat ends at the start position
        if (!lastBeat || !startBeat) return false;
        
        return lastBeat.end_pos === startBeat.start_pos;
    }

    // Check if sequence can be a CAP
    private checkCanBeCAP(sequence: (SequenceMetadata | SequenceBeat)[]): boolean {
        if (sequence.length <= 1) return false;
        
        const beats = sequence.slice(1);
        
        // Find the last non-placeholder beat
        const lastBeat = beats.slice().reverse().find(beat => 
            !(beat as SequenceBeat).is_placeholder
        ) as SequenceBeat | undefined;
        
        const startBeat = beats.find(beat => 
            (beat as SequenceBeat).beat === 0
        ) as SequenceBeat | undefined;
        
        // Check if the last beat's end position matches the start position 
        // (ignoring any numeric suffixes)
        if (!lastBeat || !startBeat) return false;
        
        const stripNumeric = (pos: string) => pos.replace(/\d+/g, '');
        
        return stripNumeric(lastBeat.end_pos ?? '') === stripNumeric(startBeat.start_pos ?? '');
    }

    // Clear the current sequence
    async clearSequence() {
        await this.saveSequence([this.defaultMetadata]);
    }
}

// Export a singleton instance
export const sequenceDataService = new SequenceDataService();
export default sequenceDataService;