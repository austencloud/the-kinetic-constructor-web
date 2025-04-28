import { LessonConfig } from './lesson_configs';
import { fetchPictographsForLetter } from '$lib/services/sequenceService';

// Dictionary mapping letters to their pictograph representations (mocked data)
const letterToPictographMap: Record<string, any> = {
	A: { id: 'a_pictograph', letter: 'A', data: { position: 'high', turn: 'clockwise' } },
	B: { id: 'b_pictograph', letter: 'B', data: { position: 'middle', turn: 'counter' } },
	C: { id: 'c_pictograph', letter: 'C', data: { position: 'high', turn: 'counter' } },
	D: { id: 'd_pictograph', letter: 'D', data: { position: 'low', turn: 'clockwise' } },
	L: { id: 'l_pictograph', letter: 'L', data: { position: 'middle', turn: 'clockwise' } },
	M: { id: 'm_pictograph', letter: 'M', data: { position: 'middle', turn: 'both' } },
	R: { id: 'r_pictograph', letter: 'R', data: { position: 'low', turn: 'counter' } },
	T: { id: 't_pictograph', letter: 'T', data: { position: 'high', turn: 'both' } }
};

// Lists of possible options for different lesson types
const letters = ['A', 'B', 'C', 'D', 'L', 'M', 'R', 'T'];
const positions = ['high', 'middle', 'low'];
const turns = ['clockwise', 'counter', 'both'];

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
	return [...array].sort(() => Math.random() - 0.5);
}

// Generate a new question based on lesson config and current index
export function generateQuestion(lessonConfig: LessonConfig, questionIndex: number) {
	switch (lessonConfig.id) {
		case 'letter_to_pictograph':
			return generateLetterToPictographQuestion(lessonConfig, questionIndex);
		case 'pictograph_to_letter':
			return generatePictographToLetterQuestion(lessonConfig, questionIndex);
		case 'turns':
			return generateTurnRecognitionQuestion(lessonConfig, questionIndex);
		case 'positions':
			return generatePositionRecognitionQuestion(lessonConfig, questionIndex);
		default:
			console.error(`Unknown lesson type: ${lessonConfig.id}`);
			return { question: null, options: [], correctAnswer: null };
	}
}

// Generate question for Letter to Pictograph lesson
function generateLetterToPictographQuestion(lessonConfig: LessonConfig, index: number) {
	// Select a letter (could be random or determined by index)
	const letter = letters[index % letters.length];
	const correctPictograph = letterToPictographMap[letter];

	// Generate wrong options
	const wrongOptions = Object.values(letterToPictographMap)
		.filter((p) => p.letter !== letter)
		.slice(0, (lessonConfig.options?.numOptions || 4) - 1);

	// Combine and shuffle options if needed
	const allOptions = lessonConfig.options?.randomizeOptions
		? shuffleArray([correctPictograph, ...wrongOptions])
		: [correctPictograph, ...wrongOptions];

	return {
		question: letter,
		options: allOptions,
		correctAnswer: correctPictograph
	};
}

// Generate question for Pictograph to Letter lesson
function generatePictographToLetterQuestion(lessonConfig: LessonConfig, index: number) {
	// Select a pictograph (could be random or determined by index)
	const letter = letters[index % letters.length];
	const pictograph = letterToPictographMap[letter];

	// Generate wrong options (other letters)
	const wrongOptions = letters.filter((l) => l !== letter);
	const selectedWrongOptions = wrongOptions.slice(0, (lessonConfig.options?.numOptions || 4) - 1);

	// Combine and shuffle options if needed
	const allOptions = lessonConfig.options?.randomizeOptions
		? shuffleArray([letter, ...selectedWrongOptions])
		: [letter, ...selectedWrongOptions];

	return {
		question: pictograph,
		options: allOptions,
		correctAnswer: letter
	};
}

// Generate question for Turn Recognition lesson
function generateTurnRecognitionQuestion(lessonConfig: LessonConfig, index: number) {
	// Select a turn type (could be random or determined by index)
	const turnType = turns[index % turns.length];

	// Find a pictograph with that turn type
	const pictographsWithTurn = Object.values(letterToPictographMap).filter(
		(p) => p.data.turn === turnType
	);

	const selectedPictograph = pictographsWithTurn[index % pictographsWithTurn.length];

	// Generate wrong options (other turn types)
	const wrongOptions = turns.filter((t) => t !== turnType);

	// Combine and shuffle options if needed
	const allOptions = lessonConfig.options?.randomizeOptions
		? shuffleArray([turnType, ...wrongOptions])
		: [turnType, ...wrongOptions];

	return {
		question: selectedPictograph,
		options: allOptions,
		correctAnswer: turnType
	};
}

// Generate question for Position Recognition lesson
function generatePositionRecognitionQuestion(lessonConfig: LessonConfig, index: number) {
	// Select a position (could be random or determined by index)
	const positionType = positions[index % positions.length];

	// Find a pictograph with that position
	const pictographsWithPosition = Object.values(letterToPictographMap).filter(
		(p) => p.data.position === positionType
	);

	const selectedPictograph = pictographsWithPosition[index % pictographsWithPosition.length];

	// Generate wrong options (other positions)
	const wrongOptions = positions.filter((p) => p !== positionType);

	// Combine and shuffle options if needed
	const allOptions = lessonConfig.options?.randomizeOptions
		? shuffleArray([positionType, ...wrongOptions])
		: [positionType, ...wrongOptions];

	return {
		question: selectedPictograph,
		options: allOptions,
		correctAnswer: positionType
	};
}

// Check if user's answer is correct
export function checkAnswerLogic(
	userAnswer: any,
	correctAnswer: any,
	lessonConfig: LessonConfig
): boolean {
	switch (lessonConfig.id) {
		case 'letter_to_pictograph':
			return userAnswer.id === correctAnswer.id;

		case 'pictograph_to_letter':
			return userAnswer === correctAnswer;

		case 'turns':
			return userAnswer === correctAnswer;

		case 'positions':
			return userAnswer === correctAnswer;

		default:
			console.error(`Unknown lesson type for answer checking: ${lessonConfig.id}`);
			return false;
	}
}

// Function to retrieve pictographs for a given letter
export async function getPictographsForLetter(letter: string): Promise<any[]> {
	try {
		// Use the imported function from sequenceService
		return await fetchPictographsForLetter(letter);
	} catch (error) {
		console.error('Error fetching pictographs:', error);
		return [];
	}
}
