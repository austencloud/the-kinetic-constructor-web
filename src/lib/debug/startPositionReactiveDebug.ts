/**
 * Debug utility to trace start position reactive chain
 * StartPositionPicker → SequenceService → ModernBeatGrid
 */

export function debugStartPositionReactiveChain() {
	console.log('🔍 Starting Start Position Reactive Chain Debug');

	// Step 1: Check if SequenceService is available in context
	const sequenceServiceElements = document.querySelectorAll('[data-sequence-service]');
	console.log('1️⃣ SequenceService elements found:', sequenceServiceElements.length);

	// Step 2: Check StartPositionPicker presence and state
	const startPositionPickers = document.querySelectorAll(
		'[data-testid="start-position-picker"], .start-position-picker'
	);
	console.log('2️⃣ StartPositionPicker elements found:', startPositionPickers.length);

	// Step 3: Check ModernBeatGrid presence
	const modernBeatGrids = document.querySelectorAll(
		'[data-testid="modern-beat-grid"], .modern-beat-grid'
	);
	console.log('3️⃣ ModernBeatGrid elements found:', modernBeatGrids.length);

	// Step 4: Check for start position pictographs
	const startPositionPictographs = document.querySelectorAll(
		'.start-position-pictograph, [data-start-position]'
	);
	console.log('4️⃣ Start position pictographs found:', startPositionPictographs.length);

	// Step 5: Check for beat cells in the grid
	const beatCells = document.querySelectorAll('.beat-cell, [data-beat-cell]');
	console.log('5️⃣ Beat cells found:', beatCells.length);

	// Step 6: Try to access window.sequenceService if available
	try {
		if (typeof window !== 'undefined' && (window as any).sequenceService) {
			const service = (window as any).sequenceService;
			console.log('6️⃣ Window SequenceService state:', {
				startPosition: service.state?.startPosition,
				beats: service.state?.beats?.length || 0,
				isEmpty: service.isEmpty
			});
		} else {
			console.log('6️⃣ Window SequenceService not available');
		}
	} catch (error) {
		console.log('6️⃣ Error accessing SequenceService:', error);
	}

	// Step 7: Check for any reactive state indicators
	const reactiveElements = document.querySelectorAll('[data-reactive], [data-state]');
	console.log('7️⃣ Reactive elements found:', reactiveElements.length);

	return {
		sequenceServiceElements: sequenceServiceElements.length,
		startPositionPickers: startPositionPickers.length,
		modernBeatGrids: modernBeatGrids.length,
		startPositionPictographs: startPositionPictographs.length,
		beatCells: beatCells.length,
		reactiveElements: reactiveElements.length
	};
}

export function simulateStartPositionClick() {
	console.log('🎯 Simulating start position click');

	try {
		// Find clickable start position elements
		const clickableElements = document.querySelectorAll(
			'.start-position-pictograph[role="button"], ' +
				'[data-start-position][role="button"], ' +
				'.pictograph-container[role="button"], ' +
				'button[data-start-position]'
		);

		console.log('🎯 Found clickable start position elements:', clickableElements.length);

		if (clickableElements.length > 0) {
			const firstElement = clickableElements[0] as HTMLElement;
			console.log('🎯 Clicking first start position element:', firstElement);

			// Simulate click
			firstElement.click();

			// Wait a bit and check for changes
			setTimeout(() => {
				console.log('🎯 Post-click state check:');
				debugStartPositionReactiveChain();
			}, 100);

			return true;
		} else {
			console.log('🎯 No clickable start position elements found');
			return false;
		}
	} catch (error) {
		console.error('🎯 Error during start position click simulation:', error);
		return false;
	}
}

export function monitorSequenceServiceChanges() {
	console.log('👁️ Setting up SequenceService monitoring');

	if (typeof window !== 'undefined') {
		// Try to access the service through various methods
		const checkService = () => {
			try {
				const service = (window as any).sequenceService;
				if (service) {
					console.log('👁️ SequenceService found, monitoring state changes...');

					// Monitor state changes safely
					if (service.setStartPosition && typeof service.setStartPosition === 'function') {
						const originalSetStartPosition = service.setStartPosition;
						service.setStartPosition = function (startPosition: any) {
							console.log('👁️ setStartPosition called with:', startPosition);
							const result = originalSetStartPosition.call(this, startPosition);
							console.log('👁️ New state after setStartPosition:', {
								startPosition: this.state?.startPosition,
								beats: this.state?.beats?.length || 0,
								isModified: this.state?.isModified
							});
							return result;
						};
					}

					return true;
				}
				return false;
			} catch (error) {
				console.log('👁️ Error accessing SequenceService:', error);
				return false;
			}
		};

		// Try immediately and with retries
		if (!checkService()) {
			let attempts = 0;
			const interval = setInterval(() => {
				attempts++;
				if (checkService() || attempts > 10) {
					clearInterval(interval);
				}
			}, 500);
		}
	}
}

export function checkContextProviders() {
	console.log('🔗 Checking context providers');

	try {
		// Look for components that might provide SequenceService context
		const potentialProviders = document.querySelectorAll(
			'[data-sequence-provider], ' +
				'[data-context-provider], ' +
				'.sequence-workbench, ' +
				'.construct-tab, ' +
				'.main-widget'
		);

		console.log('🔗 Potential context providers found:', potentialProviders.length);

		potentialProviders.forEach((element, index) => {
			const htmlElement = element as HTMLElement;
			console.log(`🔗 Provider ${index + 1}:`, {
				tagName: element.tagName,
				className: element.className,
				id: htmlElement.id,
				dataset: htmlElement.dataset
			});
		});

		return potentialProviders;
	} catch (error) {
		console.error('🔗 Error checking context providers:', error);
		return [];
	}
}

// Safe auto-run debug when loaded
if (typeof window !== 'undefined') {
	// Only expose functions on window, don't auto-run
	window.debugStartPositionReactiveChain = debugStartPositionReactiveChain;
	window.simulateStartPositionClick = simulateStartPositionClick;
	window.monitorSequenceServiceChanges = monitorSequenceServiceChanges;
	window.checkContextProviders = checkContextProviders;

	// Auto-start monitoring only after a significant delay to allow app initialization
	setTimeout(() => {
		try {
			console.log('🚀 Auto-starting start position reactive debug');
			debugStartPositionReactiveChain();
			monitorSequenceServiceChanges();
			checkContextProviders();
		} catch (error) {
			console.error('🚀 Error during auto-start debug:', error);
		}
	}, 3000); // Increased delay to 3 seconds
}

declare global {
	interface Window {
		debugStartPositionReactiveChain: typeof debugStartPositionReactiveChain;
		simulateStartPositionClick: typeof simulateStartPositionClick;
		monitorSequenceServiceChanges: typeof monitorSequenceServiceChanges;
		checkContextProviders: typeof checkContextProviders;
	}
}
