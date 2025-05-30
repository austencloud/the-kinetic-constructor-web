/**
 * DEPRECATED: This file should be deleted - use src/lib/state/simple/learnState.svelte.ts instead
 * Learn Store - Svelte 5 Runes Implementation
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

interface LearnState {
	selectedMode: LessonMode;
	currentLesson: string | null;
	isActive: boolean;
}

function createLearnStore() {
	let selectedMode = $state<LessonMode>('practice');
	let currentLesson = $state<string | null>(null);
	let isActive = $state(false);
	let currentView = $state('selector');
	let lessonConfig = $state(null);
	let isAnswerCorrect = $state(false);

	return {
		get selectedMode() {
			return selectedMode;
		},
		get currentLesson() {
			return currentLesson;
		},
		get isActive() {
			return isActive;
		},
		get currentView() {
			return currentView;
		},
		get lessonConfig() {
			return lessonConfig;
		},
		get isAnswerCorrect() {
			return isAnswerCorrect;
		},

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

		subscribe(callback: (state: any) => void) {
			// Simple subscription pattern for compatibility
			const unsubscribe = () => {};
			callback({
				selectedMode,
				currentLesson,
				isActive,
				currentView,
				lessonConfig,
				isAnswerCorrect
			});
			return unsubscribe;
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
}

function createQuizProgress() {
	let current = $state(0);
	let total = $state(0);
	let correct = $state(0);
	let incorrect = $state(0);

	return {
		get current() {
			return current;
		},
		get total() {
			return total;
		},
		get correct() {
			return correct;
		},
		get incorrect() {
			return incorrect;
		},

		setCurrent(value: number) {
			current = value;
		},
		setTotal(value: number) {
			total = value;
		},
		setCorrect(value: number) {
			correct = value;
		},
		setIncorrect(value: number) {
			incorrect = value;
		},

		subscribe(callback: (state: any) => void) {
			const unsubscribe = () => {};
			callback({ current, total, correct, incorrect });
			return unsubscribe;
		},

		reset() {
			current = 0;
			total = 0;
			correct = 0;
			incorrect = 0;
		}
	};
}

function createQuizResults() {
	let score = $state(0);
	let totalQuestions = $state(0);
	let correctAnswers = $state(0);
	let timeSpent = $state(0);

	return {
		get score() {
			return score;
		},
		get totalQuestions() {
			return totalQuestions;
		},
		get correctAnswers() {
			return correctAnswers;
		},
		get timeSpent() {
			return timeSpent;
		},

		setResults(results: QuizResults) {
			score = results.score;
			totalQuestions = results.totalQuestions;
			correctAnswers = results.correctAnswers;
			timeSpent = results.timeSpent;
		},

		subscribe(callback: (state: any) => void) {
			const unsubscribe = () => {};
			callback({ score, totalQuestions, correctAnswers, timeSpent, total: totalQuestions });
			return unsubscribe;
		},

		reset() {
			score = 0;
			totalQuestions = 0;
			correctAnswers = 0;
			timeSpent = 0;
		}
	};
}

export const learnStore = createLearnStore();
export const quizProgress = createQuizProgress();
export const quizResults = createQuizResults();
