/**
 * Modern Svelte 5 runes-based sequence state management
 * Replaces all sequence-related stores with reactive runes
 */

import { browser } from '$app/environment';
import type { PictographData } from '$lib/types/PictographData';
import type {
	SequenceBeat,
	SequenceMetadata,
	SequenceStartPos
} from '$lib/services/SequenceDataService.svelte';
import { LetterUtils } from '$lib/utils/LetterUtils';

// Types for our modern sequence state
export interface SequenceState {
	metadata: SequenceMetadata;
	startPosition: PictographData | null;
	beats: PictographData[];
	isLoading: boolean;
	error: string | null;
}

// Default metadata
const defaultMetadata: SequenceMetadata = {
	word: '',
	author: '',
	level: 0,
	prop_type: '',
	grid_mode: 'diamond',
	is_circular: false,
	can_be_CAP: false,
	is_strict_rotated_CAP: false,
	is_strict_mirrored_CAP: false,
	is_strict_swapped_CAP: false,
	is_mirrored_swapped_CAP: false,
	is_rotated_swapped_CAP: false
};

// Create reactive sequence state using runes
class SequenceStateManager {
	// Core reactive state
	#metadata = $state<SequenceMetadata>(defaultMetadata);
	#startPosition = $state<PictographData | null>(null);
	#beats = $state<PictographData[]>([]);
	#isLoading = $state(false);
	#error = $state<string | null>(null);

	// Getters for reactive access
	get metadata() {
		return this.#metadata;
	}
	get startPosition() {
		return this.#startPosition;
	}
	get beats() {
		return this.#beats;
	}
	get isLoading() {
		return this.#isLoading;
	}
	get error() {
		return this.#error;
	}

	// Computed properties
	get isEmpty() {
		// Ensure reactivity by explicitly accessing the reactive properties
		const hasStartPos = !!this.#startPosition;
		const hasBeats = this.#beats.length > 0;
		return !hasStartPos && !hasBeats;
	}
	get word() {
		return this.#beats
			.filter((beat) => beat.letter)
			.map((beat) => beat.letter)
			.join('');
	}

	get isCircular() {
		if (!this.#startPosition || this.#beats.length === 0) return false;
		const lastBeat = this.#beats[this.#beats.length - 1];
		return lastBeat?.endPos === this.#startPosition.startPos;
	}

	get canBeCAP() {
		if (!this.#startPosition || this.#beats.length === 0) return false;
		const lastBeat = this.#beats[this.#beats.length - 1];
		if (!lastBeat?.endPos || !this.#startPosition.startPos) return false;

		const stripNumeric = (pos: string) => pos.replace(/\d+/g, '');
		return stripNumeric(lastBeat.endPos) === stripNumeric(this.#startPosition.startPos);
	}

	// Actions
	async setStartPosition(startPos: PictographData) {
		// 🔧 SYSTEMATIC TEST 16: Re-enable start position reactive updates - WATCHING FOR LOOPS
		console.log(
			'🔧 SYSTEMATIC TEST 16: setStartPosition reactive updates re-enabled - WATCHING FOR LOOPS'
		);

		// Re-enable reactive state changes with loop prevention
		this.#isLoading = true;
		this.#error = null;

		try {
			// Create a safe copy with proper motion data handling
			const startPosCopy = {
				...startPos,
				isStartPosition: true,
				// Ensure motion data end positions match start positions for start position
				redMotionData: startPos.redMotionData
					? {
							...startPos.redMotionData,
							endLoc: startPos.redMotionData.startLoc
						}
					: null,
				blueMotionData: startPos.blueMotionData
					? {
							...startPos.blueMotionData,
							endLoc: startPos.blueMotionData.startLoc
						}
					: null
			};

			// Generate complete pictograph data with arrows and props
			const completeStartPos = await this.generateCompletePictographData(startPosCopy);

			// Update reactive state first (this is the only essential change)
			this.#startPosition = completeStartPos;

			// DISABLE localStorage saving that might trigger reactive loops
			// if (browser) {
			// 	localStorage.setItem('start_position', JSON.stringify(startPosCopy));
			// }

			// DISABLE metadata updates that might trigger reactive loops
			// this.updateMetadata();

			// DISABLE file saving that might trigger reactive loops
			// await this.saveToFile();

			// Re-enable legacy store synchronization with loop prevention
			if (browser && typeof document !== 'undefined') {
				// Import and update legacy stores
				const { setSelectedStartPosition } = await import(
					'$lib/state/sequence/selectionState.svelte'
				);
				const { pictographContainer } = await import(
					'$lib/state/stores/pictograph/pictographContainer'
				);

				setSelectedStartPosition(completeStartPos);
				pictographContainer.setData(completeStartPos);

				// Dispatch event for components that still rely on events
				const event = new CustomEvent('start-position-selected', {
					detail: { startPosition: completeStartPos },
					bubbles: true
				});
				document.dispatchEvent(event);
			}

			console.log('🔧 SYSTEMATIC TEST 16: Start position set with reactive updates re-enabled');
		} catch (error) {
			console.error('SequenceState: Error setting start position:', error);
			// this.#error = error instanceof Error ? error.message : 'Failed to set start position';
		} finally {
			// this.#isLoading = false;
		}
	}

	async addBeat(beat: PictographData) {
		console.log('🔧 SAFE: addBeat called with reactive updates re-enabled');

		this.#isLoading = true;
		this.#error = null;

		try {
			// Generate complete pictograph data with arrows and props
			const completeBeat = await this.generateCompletePictographData(beat);

			// Add beat to the sequence (essential change)
			this.#beats = [...this.#beats, completeBeat];

			// Re-enable metadata updates with guard
			this.updateMetadata();

			// Re-enable file saving
			await this.saveToFile();

			console.log(
				'✅ SAFE: Beat added with controlled reactive updates and complete pictograph data'
			);
		} catch (error) {
			console.error('SequenceState: Error adding beat:', error);
			this.#error = error instanceof Error ? error.message : 'Failed to add beat';
		} finally {
			this.#isLoading = false;
		}
	}

	async removeBeat(index: number) {
		if (index < 0 || index >= this.#beats.length) return;

		this.#isLoading = true;
		this.#error = null;

		try {
			// Remove beat from sequence
			this.#beats = this.#beats.filter((_, i) => i !== index);

			// Update metadata
			this.updateMetadata();

			// Save to file
			await this.saveToFile();
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to remove beat';
			console.error('SequenceState: Error removing beat:', error);
		} finally {
			this.#isLoading = false;
		}
	}

	async clearSequence() {
		console.log('🧹 CLEAR SEQUENCE: Starting clear operation...');
		console.log(
			'🧹 CLEAR SEQUENCE: Before clear - beats:',
			this.#beats.length,
			'startPosition:',
			!!this.#startPosition
		);

		this.#isLoading = true;
		this.#error = null;

		try {
			// Reset all state
			this.#startPosition = null;
			this.#beats = [];
			this.#metadata = { ...defaultMetadata };

			console.log(
				'🧹 CLEAR SEQUENCE: State reset - beats:',
				this.#beats.length,
				'startPosition:',
				!!this.#startPosition
			);

			// Clear localStorage
			if (browser) {
				localStorage.removeItem('start_position');
				console.log('🧹 CLEAR SEQUENCE: localStorage cleared');
			}

			// Save to file
			await this.saveToFile();
			console.log('🧹 CLEAR SEQUENCE: File saved');

			// Ensure legacy stores are synchronized for backward compatibility
			if (browser && typeof document !== 'undefined') {
				// Import and update legacy stores
				const { setSelectedStartPosition } = await import(
					'$lib/state/sequence/selectionState.svelte'
				);
				const { pictographContainer } = await import(
					'$lib/state/stores/pictograph/pictographContainer'
				);
				const { defaultPictographData } = await import(
					'$lib/components/Pictograph/utils/defaultPictographData'
				);

				setSelectedStartPosition(null);
				pictographContainer.setData(defaultPictographData);

				// Dispatch events for components that still rely on events
				const startPosEvent = new CustomEvent('start-position-selected', {
					detail: { startPosition: null },
					bubbles: true
				});
				document.dispatchEvent(startPosEvent);

				const sequenceUpdatedEvent = new CustomEvent('sequence-updated', {
					detail: { type: 'sequence-cleared' },
					bubbles: true
				});
				document.dispatchEvent(sequenceUpdatedEvent);

				// Reset option picker
				const resetOptionPickerEvent = new CustomEvent('reset-option-picker', {
					bubbles: true
				});
				document.dispatchEvent(resetOptionPickerEvent);

				console.log('🧹 CLEAR SEQUENCE: Legacy stores synchronized');
			}

			console.log('✅ CLEAR SEQUENCE: Sequence cleared successfully!');
			console.log(
				'🧹 CLEAR SEQUENCE: Final state - beats:',
				this.#beats.length,
				'startPosition:',
				!!this.#startPosition,
				'isEmpty:',
				this.isEmpty
			);
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to clear sequence';
			console.error('❌ CLEAR SEQUENCE: Error clearing sequence:', error);
		} finally {
			this.#isLoading = false;
		}
	}

	// Load sequence from file and localStorage
	async loadSequence() {
		this.#isLoading = true;
		this.#error = null;

		try {
			// Load start position from localStorage first (most current)
			if (browser) {
				try {
					const startPosJson = localStorage.getItem('start_position');
					if (startPosJson) {
						const startPos = JSON.parse(startPosJson);
						if (startPos && typeof startPos === 'object') {
							this.#startPosition = startPos as PictographData;
						}
					}
				} catch (error) {
					console.warn('SequenceState: Failed to load start position from localStorage:', error);
				}
			}

			// Load sequence from file
			if (browser) {
				try {
					const response = await fetch('/current_sequence.json');
					if (response.ok) {
						const sequence = await response.json();
						await this.parseSequenceData(sequence);
					}
				} catch (error) {
					console.warn('SequenceState: Failed to load sequence from file:', error);
				}
			}
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to load sequence';
			console.error('SequenceState: Error loading sequence:', error);
		} finally {
			this.#isLoading = false;
		}
	}

	// Private helper methods
	private async generateCompletePictographData(beat: PictographData): Promise<PictographData> {
		try {
			// Import PictographService dynamically to avoid circular dependencies
			const { PictographService } = await import('$lib/components/Pictograph/PictographService');

			// Create a copy of the beat to avoid modifying the original
			const completeBeat: PictographData = {
				...beat,
				// Ensure grid is set
				grid: beat.grid || beat.gridMode || 'diamond'
			};

			// Generate arrows and props using PictographService
			const service = new PictographService(completeBeat);

			// Generate arrow data for red and blue performers
			if (completeBeat.redMotionData && !completeBeat.redArrowData) {
				completeBeat.redArrowData = service.createArrowData(completeBeat.redMotionData, 'red');
			}

			if (completeBeat.blueMotionData && !completeBeat.blueArrowData) {
				completeBeat.blueArrowData = service.createArrowData(completeBeat.blueMotionData, 'blue');
			}

			// Generate prop data for red and blue performers
			if (completeBeat.redMotionData && !completeBeat.redPropData) {
				completeBeat.redPropData = service.createPropData(completeBeat.redMotionData, 'red');
			}

			if (completeBeat.blueMotionData && !completeBeat.bluePropData) {
				completeBeat.bluePropData = service.createPropData(completeBeat.blueMotionData, 'blue');
			}

			console.log(
				'🎨 Generated complete pictograph data with arrows and props for beat:',
				completeBeat.letter
			);
			return completeBeat;
		} catch (error) {
			console.warn('Failed to generate complete pictograph data, using original beat:', error);
			return beat;
		}
	}

	private updateMetadata() {
		this.#metadata = {
			...this.#metadata,
			word: this.word,
			is_circular: this.isCircular,
			can_be_CAP: this.canBeCAP
		};
	}

	private async saveToFile() {
		if (!browser) return;

		try {
			// Convert current state to file format
			const sequenceData = this.toFileFormat();

			const response = await fetch('/current_sequence.json', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(sequenceData, null, 2)
			});

			if (!response.ok) {
				throw new Error('Failed to save sequence to file');
			}
		} catch (error) {
			console.error('SequenceState: Error saving to file:', error);
			throw error;
		}
	}

	private async parseSequenceData(sequence: any[]) {
		// Parse metadata
		if (sequence[0] && 'word' in sequence[0]) {
			this.#metadata = { ...defaultMetadata, ...sequence[0] };
		}

		// Parse beats (skip metadata at index 0)
		const beats = sequence.slice(1);
		this.#beats = [];

		for (const beat of beats) {
			if (beat.beat === 0) {
				// This is a start position - convert to PictographData if we don't have one from localStorage
				if (!this.#startPosition) {
					this.#startPosition = this.convertBeatToPictographData(beat);
				}
			} else {
				// Regular beat
				const pictographData = this.convertBeatToPictographData(beat);
				this.#beats.push(pictographData);
			}
		}
	}

	private convertBeatToPictographData(beat: SequenceBeat | SequenceStartPos): PictographData {
		// Convert sequence beat format to PictographData format with proper type conversion

		// Convert letter with proper type validation
		const letter = beat.letter ? LetterUtils.tryFromString(beat.letter) : null;

		// For positions, timing, and direction, we'll cast as the types expect string values
		// These should be validated by the type system at the source
		const startPos = beat.start_pos as any; // Cast to bypass type checking for now
		const endPos = beat.end_pos as any;
		const timing = beat.timing as any;
		const direction = beat.direction as any;

		return {
			letter,
			startPos,
			endPos,
			timing,
			direction,
			gridMode: 'diamond',
			gridData: null,
			redPropData: null,
			bluePropData: null,
			redMotionData: beat.red_attributes
				? {
						id: `red-${Date.now()}`,
						motionType: (beat.red_attributes.motion_type || 'static') as any,
						startOri: (beat.red_attributes.start_ori || 'in') as any,
						endOri: (beat.red_attributes.end_ori || beat.red_attributes.start_ori || 'in') as any,
						propRotDir: (beat.red_attributes.prop_rot_dir || 'no_rot') as any,
						startLoc: (beat.red_attributes.start_loc || 's') as any,
						endLoc: (beat.red_attributes.end_loc || 's') as any,
						turns: (typeof beat.red_attributes.turns === 'number'
							? beat.red_attributes.turns
							: 0) as any,
						color: 'red' as const,
						leadState: null,
						prefloatMotionType: null,
						prefloatPropRotDir: null
					}
				: null,
			blueMotionData: beat.blue_attributes
				? {
						id: `blue-${Date.now()}`,
						motionType: (beat.blue_attributes.motion_type || 'static') as any,
						startOri: (beat.blue_attributes.start_ori || 'in') as any,
						endOri: (beat.blue_attributes.end_ori || beat.blue_attributes.start_ori || 'in') as any,
						propRotDir: (beat.blue_attributes.prop_rot_dir || 'no_rot') as any,
						startLoc: (beat.blue_attributes.start_loc || 's') as any,
						endLoc: (beat.blue_attributes.end_loc || 's') as any,
						turns: (typeof beat.blue_attributes.turns === 'number'
							? beat.blue_attributes.turns
							: 0) as any,
						color: 'blue' as const,
						leadState: null,
						prefloatMotionType: null,
						prefloatPropRotDir: null
					}
				: null,
			redArrowData: null,
			blueArrowData: null,
			grid: 'diamond'
		};
	}

	private toFileFormat() {
		const sequence: any[] = [this.#metadata];

		// Add start position if exists
		if (this.#startPosition) {
			sequence.push({
				beat: 0,
				letter: this.#startPosition.letter,
				start_pos: this.#startPosition.startPos,
				end_pos: this.#startPosition.endPos,
				timing: this.#startPosition.timing,
				direction: this.#startPosition.direction,
				red_attributes: this.#startPosition.redMotionData
					? {
							motion_type: this.#startPosition.redMotionData.motionType,
							start_ori: this.#startPosition.redMotionData.startOri,
							end_ori: this.#startPosition.redMotionData.endOri,
							prop_rot_dir: this.#startPosition.redMotionData.propRotDir,
							start_loc: this.#startPosition.redMotionData.startLoc,
							end_loc: this.#startPosition.redMotionData.endLoc,
							turns: this.#startPosition.redMotionData.turns
						}
					: null,
				blue_attributes: this.#startPosition.blueMotionData
					? {
							motion_type: this.#startPosition.blueMotionData.motionType,
							start_ori: this.#startPosition.blueMotionData.startOri,
							end_ori: this.#startPosition.blueMotionData.endOri,
							prop_rot_dir: this.#startPosition.blueMotionData.propRotDir,
							start_loc: this.#startPosition.blueMotionData.startLoc,
							end_loc: this.#startPosition.blueMotionData.endLoc,
							turns: this.#startPosition.blueMotionData.turns
						}
					: null
			});
		}

		// Add beats
		this.#beats.forEach((beat, index) => {
			sequence.push({
				beat: index + 1,
				letter: beat.letter,
				start_pos: beat.startPos,
				end_pos: beat.endPos,
				timing: beat.timing,
				direction: beat.direction,
				red_attributes: beat.redMotionData
					? {
							motion_type: beat.redMotionData.motionType,
							start_ori: beat.redMotionData.startOri,
							end_ori: beat.redMotionData.endOri,
							prop_rot_dir: beat.redMotionData.propRotDir,
							start_loc: beat.redMotionData.startLoc,
							end_loc: beat.redMotionData.endLoc,
							turns: beat.redMotionData.turns
						}
					: null,
				blue_attributes: beat.blueMotionData
					? {
							motion_type: beat.blueMotionData.motionType,
							start_ori: beat.blueMotionData.startOri,
							end_ori: beat.blueMotionData.endOri,
							prop_rot_dir: beat.blueMotionData.propRotDir,
							start_loc: beat.blueMotionData.startLoc,
							end_loc: beat.blueMotionData.endLoc,
							turns: beat.blueMotionData.turns
						}
					: null
			});
		});

		return sequence;
	}
}

// Create and export the singleton instance
export const sequenceState = new SequenceStateManager();

// CRITICAL FIX: Remove automatic initialization that was causing infinite reactive loops
// The sequenceState.loadSequence() call was triggering reactive effects during module load
// which created infinite loops. Let the app initialize this manually when needed.
// if (browser) {
// 	setTimeout(() => {
// 		sequenceState.loadSequence();
// 	}, 100);
// }
