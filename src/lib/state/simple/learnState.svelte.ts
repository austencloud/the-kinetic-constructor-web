/**
 * Learn State - Pure Svelte 5 Runes
 * NO STORES - RUNES ONLY!
 */

export type LessonMode = 'practice' | 'quiz' | 'review';

interface QuizProgress {
	current: number;
	total: number;
	correct: number;
	incorrect: number;
}

interface QuizResults {
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	timeSpent: number;
}

// Pure runes state - no stores!
let selectedMode = $state<LessonMode>('practice');
let currentLesson = $state<string | null>(null);
let isActive = $state(false);
let currentView = $state('selector');
let lessonConfig = $state<any>(null);
let isAnswerCorrect = $state(false);

// Quiz progress runes
let quizCurrent = $state(0);
let quizTotal = $state(0);
let quizCorrect = $state(0);
let quizIncorrect = $state(0);

// Quiz results runes
let resultScore = $state(0);
let resultTotalQuestions = $state(0);
let resultCorrectAnswers = $state(0);
let resultTimeSpent = $state(0);

/**
 * Learn State - Pure Runes API
 */
export const learnState = {
	// Getters
	get selectedMode() { return selectedMode; },
	get currentLesson() { return currentLesson; },
	get isActive() { return isActive; },
	get currentView() { return currentView; },
	get lessonConfig() { return lessonConfig; },
	get isAnswerCorrect() { return isAnswerCorrect; },

	// Actions
	setMode(mode: LessonMode) {
		selectedMode = mode;
	},

	setCurrentLesson(lesson: string | null) {
		currentLesson = lesson;
	},

	setActive(active: boolean) {
		isActive = active;
	},

	setCurrentView(view: string) {
		currentView = view;
	},

	setLessonConfig(config: any) {
		lessonConfig = config;
	},

	setAnswerCorrect(correct: boolean) {
		isAnswerCorrect = correct;
	},

	goBackToSelector() {
		currentView = 'selector';
		currentLesson = null;
	},

	startOver() {
		isActive = false;
		currentView = 'selector';
	},

	reset() {
		selectedMode = 'practice';
		currentLesson = null;
		isActive = false;
		currentView = 'selector';
		lessonConfig = null;
		isAnswerCorrect = false;
	}
};

/**
 * Quiz Progress - Pure Runes API
 */
export const quizProgress = {
	get current() { return quizCurrent; },
	get total() { return quizTotal; },
	get correct() { return quizCorrect; },
	get incorrect() { return quizIncorrect; },

	setCurrent(value: number) { quizCurrent = value; },
	setTotal(value: number) { quizTotal = value; },
	setCorrect(value: number) { quizCorrect = value; },
	setIncorrect(value: number) { quizIncorrect = value; },

	reset() {
		quizCurrent = 0;
		quizTotal = 0;
		quizCorrect = 0;
		quizIncorrect = 0;
	}
};

/**
 * Quiz Results - Pure Runes API
 */
export const quizResults = {
	get score() { return resultScore; },
	get totalQuestions() { return resultTotalQuestions; },
	get correctAnswers() { return resultCorrectAnswers; },
	get timeSpent() { return resultTimeSpent; },
	get total() { return resultTotalQuestions; }, // Alias for compatibility

	setResults(results: QuizResults) {
		resultScore = results.score;
		resultTotalQuestions = results.totalQuestions;
		resultCorrectAnswers = results.correctAnswers;
		resultTimeSpent = results.timeSpent;
	},

	reset() {
		resultScore = 0;
		resultTotalQuestions = 0;
		resultCorrectAnswers = 0;
		resultTimeSpent = 0;
	}
};

// Export for backward compatibility (but these should be replaced with direct runes usage)
export const learnStore = learnState;
export { quizProgress, quizResults };
