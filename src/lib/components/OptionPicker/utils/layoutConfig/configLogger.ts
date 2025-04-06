// src/lib/components/OptionPicker/utils/layoutConfig/configLogger.ts
export class LayoutConfigLogger {
	private static isDebugMode = false;

	static enableDebugMode() {
		this.isDebugMode = true;
	}

	static disableDebugMode() {
		this.isDebugMode = false;
	}

	static logLayoutCalculation(params: {
		deviceType: string;
		containerWidth: number;
		containerHeight: number;
		itemCount: number;
	}) {
		if (!this.isDebugMode) return;

		console.group('Layout Calculation');
		console.log('Device Type:', params.deviceType);
		console.log('Container Size:', `${params.containerWidth}x${params.containerHeight}`);
		console.log('Item Count:', params.itemCount);
		console.groupEnd();
	}

	static warn(message: string, details?: any) {
		console.warn(`Layout Config Warning: ${message}`, details);

		// Optional: Add more sophisticated logging or error tracking
		if (details) {
			console.trace('Warning Details');
		}
	}

	static error(message: string, error?: Error) {
		console.error(`Layout Config Error: ${message}`, error);
	}
}
