// src/lib/types/ErrorTypes.ts
/**
 * Standard error interface for consistent error handling throughout the application
 */
export interface AppError {
	name?: string;
	message: string;
	stack?: string;
	cause?: unknown;
	component?: string;
	code?: string;
	details?: Record<string, unknown>;
}

/**
 * Convert any error to a standardized AppError
 *
 * @param error The error to convert
 * @param defaultMessage Default message if error is not an Error object
 * @returns A standardized AppError object
 */
export function toAppError(error: unknown, defaultMessage = 'An unknown error occurred'): AppError {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
			cause: error.cause
		};
	}

	if (typeof error === 'string') {
		return {
			message: error
		};
	}

	if (error && typeof error === 'object') {
		// Try to extract message from object
		const objError = error as Record<string, unknown>;
		const message = typeof objError.message === 'string' ? objError.message : defaultMessage;

		return {
			message,
			details: objError
		};
	}

	return {
		message: defaultMessage,
		details: { originalError: error }
	};
}

/**
 * Parameters for log entries
 */
export interface LogEntryParams {
	message: string;
	source?: string;
	[key: string]: unknown;
}

/**
 * Type for logger methods
 */
export type LoggerMethod = (
	message: string,
	params?: Omit<LogEntryParams, 'message' | 'source'>
) => void;
