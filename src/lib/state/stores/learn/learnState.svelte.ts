import { lessonConfigs } from './lesson_configs';
import { checkAnswerLogic, generateQuestion } from './lessonService';
import { progressState } from './progressState.svelte';

export type LessonMode = 'fixed_question' | 'countdown';
export type ViewType = 'selector' | 'lesson' | 'results';

interface LearnState {
	currentView: ViewType;
	selectedLessonType: string | null;
	selectedMode: LessonMode;
	lessonConfig: any | null;
	quizActive: boolean;
	currentQuestionIndex: number;
	totalQuestions: number;
	remainingTime: number;
	currentQuestionData: any;
	currentAnswerOptions: any[];
	correctAnswer: any;
	userAnswer: any | null;
	isAnswerCorrect: boolean | null;
	incorrectGuesses: number;
	score: number;
	lessonHistory: Array<{
		question: any;
		correctAnswer: any;
		userAnswer: any;
		isCorrect: boolean;
	}>;
}

const initialState: LearnState = {
	currentView: 'selector',
	selectedLessonType: null,
	selectedMode: 'fixed_question',
	lessonConfig: null,
	quizActive: false,
	currentQuestionIndex: 0,
	totalQuestions: 30, // Default for fixed_question mode
	remainingTime: 60, // Default for countdown mode (seconds)
	currentQuestionData: null,
	currentAnswerOptions: [],
	correctAnswer: null,
	userAnswer: null,
	isAnswerCorrect: null,
	incorrectGuesses: 0,
	score: 0,
	lessonHistory: []
};

const createLearnState = () => {
	// Reactive state with Svelte 5 runes
	let state = $state<LearnState>({ ...initialState });

	// Timer interval reference
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	return {
		// State getter
		get state() {
			return state;
		},

		selectLesson: (lessonType: string) => {
			const config = lessonConfigs.find((c) => c.id === lessonType);

			if (!config) {
				console.error(`Lesson config not found for: ${lessonType}`);
				return;
			}

			state = {
				...state,
				selectedLessonType: lessonType,
				lessonConfig: config,
				currentView: 'lesson'
			};
		},

		setMode: (mode: LessonMode) => {
			state = {
				...state,
				selectedMode: mode
			};
		},

		startLesson: () => {
			// Stop any existing timer
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}

			state = {
				...state,
				quizActive: true,
				currentQuestionIndex: 0,
				score: 0,
				incorrectGuesses: 0,
				userAnswer: null,
				isAnswerCorrect: null,
				lessonHistory: [],
				remainingTime: state.selectedMode === 'countdown' ? 60 : 0
			};

			// Start timer if in countdown mode
			if (state.selectedMode === 'countdown' && state.quizActive) {
				timerInterval = setInterval(() => {
					learnState.updateTimer();
				}, 1000);
			}

			// Generate the first question
			learnState.generateNextQuestion();
		},

		generateNextQuestion: () => {
			if (!state.lessonConfig) return;

			const { question, options, correctAnswer } = generateQuestion(
				state.lessonConfig,
				state.currentQuestionIndex
			);

			state = {
				...state,
				currentQuestionData: question,
				currentAnswerOptions: options,
				correctAnswer,
				userAnswer: null,
				isAnswerCorrect: null
			};
		},

		submitAnswer: (answer: any) => {
			const isCorrect = checkAnswerLogic(answer, state.correctAnswer, state.lessonConfig);

			// Update lesson history
			const historyEntry = {
				question: state.currentQuestionData,
				correctAnswer: state.correctAnswer,
				userAnswer: answer,
				isCorrect
			};

			const updatedHistory = [...state.lessonHistory, historyEntry];

			// Update score
			const newScore = isCorrect ? state.score + 1 : state.score;
			const newIncorrectGuesses = isCorrect ? state.incorrectGuesses : state.incorrectGuesses + 1;

			state = {
				...state,
				userAnswer: answer,
				isAnswerCorrect: isCorrect,
				score: newScore,
				incorrectGuesses: newIncorrectGuesses,
				lessonHistory: updatedHistory
			};
		},

		nextQuestionOrEnd: () => {
			const nextIndex = state.currentQuestionIndex + 1;

			// Check if we've reached the end of the quiz
			if (state.selectedMode === 'fixed_question' && nextIndex >= state.totalQuestions) {
				if (timerInterval) {
					clearInterval(timerInterval);
					timerInterval = null;
				}

				// Update progress store with the lesson results
				if (state.selectedLessonType) {
					const score = Math.round((state.score / state.totalQuestions) * 100);

					progressState.updateLessonProgress(
						state.selectedLessonType,
						score,
						state.lessonHistory.length,
						state.totalQuestions
					);
				}

				state = {
					...state,
					currentView: 'results',
					quizActive: false
				};
				return;
			}

			state = {
				...state,
				currentQuestionIndex: nextIndex
			};
		},

		updateTimer: () => {
			if (!state.quizActive || state.selectedMode !== 'countdown') {
				return;
			}

			const newTime = Math.max(0, state.remainingTime - 1);

			if (newTime === 0) {
				if (timerInterval) {
					clearInterval(timerInterval);
					timerInterval = null;
				}

				// Update progress store with the lesson results
				if (state.selectedLessonType) {
					const totalQuestions = state.lessonHistory.length;
					const score = totalQuestions > 0 ? Math.round((state.score / totalQuestions) * 100) : 0;

					progressState.updateLessonProgress(
						state.selectedLessonType,
						score,
						totalQuestions,
						totalQuestions
					);
				}

				state = {
					...state,
					remainingTime: 0,
					currentView: 'results',
					quizActive: false
				};
				return;
			}

			state = {
				...state,
				remainingTime: newTime
			};
		},

		showResults: () => {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}

			// Update progress store with the lesson results
			if (state.selectedLessonType) {
				const totalQuestions =
					state.selectedMode === 'fixed_question'
						? state.totalQuestions
						: state.lessonHistory.length;

				const score = Math.round((state.score / totalQuestions) * 100);

				progressState.updateLessonProgress(
					state.selectedLessonType,
					score,
					state.lessonHistory.length,
					totalQuestions
				);
			}

			state = {
				...state,
				currentView: 'results',
				quizActive: false
			};
		},

		goBackToSelector: () => {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}

			state = { ...initialState };
		},

		startOver: () => {
			state = {
				...state,
				currentView: 'lesson'
			};

			learnState.startLesson();
		}
	};
};

export const learnState = createLearnState();

// Derived getters for convenience
export const currentQuestion = $derived(learnState.state.currentQuestionData);

export const currentAnswers = $derived(learnState.state.currentAnswerOptions);

export const quizProgress = $derived({
	current: learnState.state.currentQuestionIndex + 1,
	total: learnState.state.totalQuestions,
	remainingTime: learnState.state.remainingTime
});

export const quizResults = $derived({
	score: learnState.state.score,
	total:
		learnState.state.selectedMode === 'fixed_question'
			? learnState.state.totalQuestions
			: learnState.state.lessonHistory.length,
	incorrectGuesses: learnState.state.incorrectGuesses,
	history: learnState.state.lessonHistory
});
