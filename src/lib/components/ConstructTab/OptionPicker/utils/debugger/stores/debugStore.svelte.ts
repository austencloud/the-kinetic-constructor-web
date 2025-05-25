// src/lib/components/ConstructTab/OptionPicker/utils/debugger/stores/debugStore.svelte.ts
// Svelte 5 runes-based debug store

import { untrack } from 'svelte';
import { FoldableDeviceUtils } from '$lib/utils/deviceDetection';
import { activeLayoutRule } from '../../layoutUtils';
import { browser } from '$app/environment';

// Types
export type CopyStatus = 'idle' | 'copying' | 'copied' | 'error';

// Create reactive state using Svelte 5 runes
export const debugState = {
	isDebuggerVisible: $state(false),
	copyStatus: $state<CopyStatus>('idle'),
	copyError: $state<string | null>(null),
	currentStateCopyStatus: $state<CopyStatus>('idle'),
	currentStateCopyError: $state<string | null>(null),
	simulateFoldable: $state(
		browser && localStorage.getItem('foldableDeviceOverride') ? true : false
	),
	simulatedFoldableType: $state<'zfold' | 'other'>('zfold'),
	simulatedFoldState: $state<boolean>(true)
};

// Initialize values from existing override if available
if (browser) {
	try {
		const existingOverride = localStorage.getItem('foldableDeviceOverride');
		if (existingOverride) {
			const settings = JSON.parse(existingOverride);
			untrack(() => {
				debugState.simulatedFoldableType = settings.foldableType || 'zfold';
				debugState.simulatedFoldState = settings.isUnfolded;
			});
		}
	} catch (e) {
		console.error('Error reading existing foldable override:', e);
	}
}

// Timeout IDs
let copyTimeoutId: ReturnType<typeof setTimeout> | null = null;
let currentStateCopyTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Guard flag to prevent reactive loops
let isProcessing = false;

// Export getter function for components that need to access the state
export function getDebugState() {
	return debugState;
}

// Action functions
export function toggleDebugger() {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		debugState.isDebuggerVisible = !debugState.isDebuggerVisible;
		if (!debugState.isDebuggerVisible) {
			resetCopyStates();
		}
	});
	isProcessing = false;
}

export function resetCopyStates() {
	if (isProcessing) return;
	
	clearTimeout(copyTimeoutId || undefined);
	clearTimeout(currentStateCopyTimeoutId || undefined);
	
	isProcessing = true;
	untrack(() => {
		debugState.copyStatus = 'idle';
		debugState.copyError = null;
		debugState.currentStateCopyStatus = 'idle';
		debugState.currentStateCopyError = null;
	});
	isProcessing = false;
	
	copyTimeoutId = null;
	currentStateCopyTimeoutId = null;
}

export function applyFoldableSimulation() {
	if (isProcessing) return;
	
	const isSimulating = debugState.simulateFoldable;
	if (isSimulating) {
		FoldableDeviceUtils.setManualOverride({
			isFoldable: true,
			foldableType: debugState.simulatedFoldableType,
			isUnfolded: debugState.simulatedFoldState
		});
	} else {
		FoldableDeviceUtils.clearManualOverride();
	}

	const message = isSimulating
		? 'Foldable device simulation settings applied! Page reload required to apply changes. Reload now?'
		: 'Foldable device simulation disabled! Page reload required to apply changes. Reload now?';

	if (browser && confirm(message)) {
		window.location.reload();
	}
}

export async function copyToClipboard(
	textBuilder: () => string,
	isCurrentState: boolean = false
) {
	if (isProcessing) return;
	
	const statusKey = isCurrentState ? 'currentStateCopyStatus' : 'copyStatus';
	const errorKey = isCurrentState ? 'currentStateCopyError' : 'copyError';
	const timeoutRef = isCurrentState ? currentStateCopyTimeoutId : copyTimeoutId;
	
	clearTimeout(timeoutRef || undefined);
	
	if (!browser || !navigator.clipboard) {
		isProcessing = true;
		untrack(() => {
			debugState[errorKey] = 'Clipboard API not available.';
			debugState[statusKey] = 'error';
		});
		isProcessing = false;
		resetStatusAfterDelay(isCurrentState);
		return;
	}

	isProcessing = true;
	untrack(() => {
		debugState[statusKey] = 'copying';
		debugState[errorKey] = null;
	});
	isProcessing = false;

	try {
		await navigator.clipboard.writeText(textBuilder());
		isProcessing = true;
		untrack(() => {
			debugState[statusKey] = 'copied';
		});
		isProcessing = false;
	} catch (err) {
		isProcessing = true;
		untrack(() => {
			debugState[errorKey] = 'Failed to copy.';
			debugState[statusKey] = 'error';
		});
		isProcessing = false;
		console.error('Failed to copy text:', err);
	} finally {
		resetStatusAfterDelay(isCurrentState);
	}
}

// Get debug info text without copying (for CopyButton)
export async function getDebugInfoText(layoutContext?: any): Promise<string> {
	return buildDebugInfoText(layoutContext);
}

export async function copyDebugInfo(layoutContext?: any) {
	await copyToClipboard(() => buildDebugInfoText(layoutContext), false);
}

export async function copyCurrentState(layoutContext: any) {
	await copyToClipboard(() => buildCurrentStateText(layoutContext), true);
}

export function cleanup() {
	clearTimeout(copyTimeoutId || undefined);
	clearTimeout(currentStateCopyTimeoutId || undefined);
}

export function setSimulateFoldable(value: boolean) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		debugState.simulateFoldable = value;
	});
	isProcessing = false;
}

export function setSimulatedFoldableType(type: 'zfold' | 'other') {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		debugState.simulatedFoldableType = type;
	});
	isProcessing = false;
}

export function setSimulatedFoldState(state: boolean) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		debugState.simulatedFoldState = state;
	});
	isProcessing = false;
}

// Helper functions
function buildDebugInfoText(layoutContext?: any): string {
	// Note: activeLayoutRule might need to be accessed differently in runes context
	const rule = activeLayoutRule; // This might need adjustment based on how activeLayoutRule is implemented
	let text = rule
		? `Active Layout Rule:\nDescription: ${rule.description}\nColumns: ${rule.columns}${
				rule.maxColumns ? ` (Max: ${rule.maxColumns})` : ''
			}\n${buildConditionsText(rule.when)}`
		: 'Active Layout Rule: None Matched\n';

	text += `\n${buildCurrentStateText(layoutContext)}`;
	text += `\n\nFoldable Device Detection:\n${JSON.stringify(FoldableDeviceUtils.getDebugInfo(), null, 2)}`;
	return text;
}

function buildConditionsText(conditions: any): string {
	if (!conditions) return '';
	return `Conditions:\n${Object.entries(conditions)
		.map(([key, value]) => `  - ${key}: ${value}`)
		.join('\n')}`;
}

export function buildCurrentStateText(layoutContext: any): string {
	if (!layoutContext) return 'Layout context not available';

	const foldableInfo = layoutContext.foldableInfo || {
		isFoldable: false,
		isUnfolded: false,
		foldableType: 'unknown',
		confidence: 0
	};

	// Note: activeLayoutRule access might need adjustment
	const activeRule = activeLayoutRule;
	const ua = browser ? navigator.userAgent : 'Unknown';
	const uaShort = ua.substring(0, 80) + (ua.length > 80 ? '...' : '');
	return `Current State:
  - Active Rule: ${activeRule?.description || 'No rule matched'}
  - Columns: ${layoutContext.layoutConfig.gridColumns.match(/repeat\((\d+)\)/)?.[1] || 'unknown'}
  - Device: ${layoutContext.deviceType} (${layoutContext.isMobile ? 'mobile' : 'desktop'})
  - Foldable: ${foldableInfo.isFoldable ? 'Yes' : 'No'}
${
	foldableInfo.isFoldable
		? `  - Type: ${foldableInfo.foldableType}
  - Unfolded: ${foldableInfo.isUnfolded ? 'Yes' : 'No'}
  - Detection: ${foldableInfo.detectionMethod || 'Unknown'}
  - Confidence: ${foldableInfo.confidence || 'N/A'}`
		: ''
}
  - Aspect: ${layoutContext.containerAspect}
  - Orientation: ${layoutContext.isPortrait ? 'portrait' : 'landscape'}
  - Size: ${layoutContext.containerWidth}×${layoutContext.containerHeight}
  - Pixel Ratio: ${browser ? window.devicePixelRatio : 'N/A'}
  - User Agent: ${uaShort}`;
}

function resetStatusAfterDelay(isCurrentState: boolean = false, delay = 2000) {
	const timeoutId = setTimeout(() => {
		isProcessing = true;
		untrack(() => {
			if (isCurrentState) {
				debugState.currentStateCopyStatus = 'idle';
				debugState.currentStateCopyError = null;
				currentStateCopyTimeoutId = null;
			} else {
				debugState.copyStatus = 'idle';
				debugState.copyError = null;
				copyTimeoutId = null;
			}
		});
		isProcessing = false;
	}, delay);
	
	if (isCurrentState) {
		currentStateCopyTimeoutId = timeoutId;
	} else {
		copyTimeoutId = timeoutId;
	}
}

// Compatibility layer for old store API
export const debugActions = {
	toggleDebugger,
	resetCopyStates,
	applyFoldableSimulation,
	copyToClipboard,
	getDebugInfoText,
	copyDebugInfo,
	copyCurrentState,
	cleanup
};

// Export individual stores for backward compatibility
export const isDebuggerVisible = {
	get value() {
		return debugState.isDebuggerVisible;
	},
	set: (value: boolean) => {
		if (isProcessing) return;
		isProcessing = true;
		untrack(() => {
			debugState.isDebuggerVisible = value;
		});
		isProcessing = false;
	},
	update: (fn: (value: boolean) => boolean) => {
		if (isProcessing) return;
		isProcessing = true;
		untrack(() => {
			debugState.isDebuggerVisible = fn(debugState.isDebuggerVisible);
		});
		isProcessing = false;
	}
};

export const copyStatus = {
	get value() {
		return debugState.copyStatus;
	}
};

export const copyError = {
	get value() {
		return debugState.copyError;
	}
};

export const currentStateCopyStatus = {
	get value() {
		return debugState.currentStateCopyStatus;
	}
};

export const currentStateCopyError = {
	get value() {
		return debugState.currentStateCopyError;
	}
};

export const simulateFoldable = {
	get value() {
		return debugState.simulateFoldable;
	},
	set: setSimulateFoldable
};

export const simulatedFoldableType = {
	get value() {
		return debugState.simulatedFoldableType;
	},
	set: setSimulatedFoldableType
};

export const simulatedFoldState = {
	get value() {
		return debugState.simulatedFoldState;
	},
	set: setSimulatedFoldState
};
