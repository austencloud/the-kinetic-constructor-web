import { LogLevel, type LogEntry, type LogTransport } from '../types';
import { CONSOLE_COLORS, CONSOLE_SYMBOLS } from '../constants';

export interface ConsoleTransportOptions {
	prettyPrint?: boolean;
	includeTimestamps?: boolean;
	includeSource?: boolean;
	includeDomain?: boolean;
	includeCorrelationId?: boolean;
}

export class ConsoleTransport implements LogTransport {
	name = 'console';
	private options: ConsoleTransportOptions;

	constructor(options: ConsoleTransportOptions = {}) {
		this.options = {
			prettyPrint: true,
			includeTimestamps: true,
			includeSource: true,
			includeDomain: true,
			includeCorrelationId: true,
			...options
		};
	}

	log(entry: LogEntry): void {
		if (typeof console === 'undefined') return;

		const method = this.getConsoleMethod(entry.level);

		if (this.options.prettyPrint) {
			this.prettyPrint(entry, method);
		} else {
			this.simplePrint(entry, method);
		}
	}

	private getConsoleMethod(level: LogLevel): 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'log' {
		switch (level) {
			case LogLevel.TRACE:
				return 'trace';
			case LogLevel.DEBUG:
				return 'debug';
			case LogLevel.INFO:
				return 'info';
			case LogLevel.WARN:
				return 'warn';
			case LogLevel.ERROR:
			case LogLevel.FATAL:
				return 'error';
			default:
				return 'log';
		}
	}

	private simplePrint(
		entry: LogEntry,
		method: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'log'
	): void {
		let message = '';

		if (this.options.includeTimestamps) {
			const date = new Date(entry.timestamp);
			message += `[${date.toISOString()}] `;
		}

		message += `[${entry.levelName.toUpperCase()}]`;

		if (this.options.includeSource) {
			message += ` [${entry.source}]`;
		}

		if (this.options.includeDomain && entry.domain) {
			message += ` [${entry.domain}]`;
		}

		if (this.options.includeCorrelationId && entry.correlationId) {
			message += ` [${entry.correlationId}]`;
		}

		message += `: ${entry.message}`;

		if (entry.data || entry.error) {
			console[method](message, { ...entry.data, error: entry.error });
		} else {
			console[method](message);
		}
	}

	private prettyPrint(
		entry: LogEntry,
		method: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'log'
	): void {
		const color = CONSOLE_COLORS[entry.level] || '#000000';
		const symbol = CONSOLE_SYMBOLS[entry.level] || '';

		const parts: string[] = [];

		if (this.options.includeTimestamps) {
			const date = new Date(entry.timestamp);
			const timeString = date.toISOString().split('T')[1].split('.')[0];
			parts.push(`%c${timeString}`);
			parts.push('color: #888; font-weight: normal;');
		}

		parts.push(`%c${symbol} ${entry.levelName.toUpperCase()}`);
		parts.push(`color: ${color}; font-weight: bold;`);

		let sourceText = '';
		if (this.options.includeSource) {
			sourceText += entry.source;
		}
		if (this.options.includeDomain && entry.domain) {
			sourceText += sourceText ? `:${entry.domain}` : entry.domain;
		}
		if (sourceText) {
			parts.push(`%c[${sourceText}]`);
			parts.push('color: #0066cc; font-weight: bold;');
		}

		if (this.options.includeCorrelationId && entry.correlationId) {
			parts.push(`%c[${entry.correlationId}]`);
			parts.push('color: #6610f2; font-weight: normal;');
		}

		parts.push('%c' + entry.message);
		parts.push('color: inherit; font-weight: normal;');

		if (entry.duration !== undefined) {
			parts.push(`%c(${entry.duration.toFixed(2)}ms)`);

			if (entry.duration < 50) {
				parts.push('color: #28a745; font-weight: normal;');
			} else if (entry.duration < 200) {
				parts.push('color: #ffc107; font-weight: normal;');
			} else {
				parts.push('color: #dc3545; font-weight: normal;');
			}
		}

		console[method](...parts);

		if (entry.data || entry.error || entry.renderMetrics) {
			console.groupCollapsed('Details');

			if (entry.data) {
				console.log('Data:', entry.data);
			}

			if (entry.renderMetrics) {
				console.log('Render Metrics:', entry.renderMetrics);
			}

			if (entry.error) {
				console.error('Error:', entry.error);
			}

			console.groupEnd();
		}
	}
}
