/**
 * Browser-based reactive chain test
 * Tests the actual StartPositionPicker → SequenceService → ModernBeatGrid flow in the browser
 */

export function testReactiveChainInBrowser() {
	console.log('🧪 Starting browser reactive chain test...');

	try {
		// Step 1: Check if services are available
		const services = (window as any).__modernServices;
		if (!services) {
			console.error('❌ Modern services not found on window');
			return false;
		}

		const sequenceService = services.sequence;
		if (!sequenceService) {
			console.error('❌ SequenceService not found in modern services');
			return false;
		}

		console.log('✅ SequenceService found:', sequenceService);

		// Step 2: Log initial state
		console.log('📊 Initial state:', {
			startPosition: sequenceService.state?.startPosition,
			beats: sequenceService.state?.beats?.length || 0,
			isEmpty: sequenceService.isEmpty,
			isModified: sequenceService.state?.isModified
		});

		// Step 3: Create a mock start position
		const mockStartPosition = {
			letter: 'α1',
			startPos: 'n',
			endPos: 'n',
			grid: 'diamond',
			redPropData: {
				prop: 'staff',
				hand: 'right',
				location: 'n'
			},
			bluePropData: {
				prop: 'staff',
				hand: 'left',
				location: 'n'
			},
			redMotionData: {
				motionType: 'static',
				startOri: 'in',
				endOri: 'in',
				location: 'n'
			},
			blueMotionData: {
				motionType: 'static',
				startOri: 'in',
				endOri: 'in',
				location: 'n'
			}
		};

		// Step 4: Test setStartPosition
		console.log('🎯 Testing setStartPosition...');
		if (
			sequenceService.setStartPosition &&
			typeof sequenceService.setStartPosition === 'function'
		) {
			sequenceService.setStartPosition(mockStartPosition);
		} else {
			console.error('❌ setStartPosition method not available');
			return false;
		}

		// Step 5: Check state after setting start position
		console.log('📊 State after setStartPosition:', {
			startPosition: sequenceService.state?.startPosition?.letter,
			beats: sequenceService.state?.beats?.length || 0,
			isEmpty: sequenceService.isEmpty,
			isModified: sequenceService.state?.isModified
		});

		// Step 6: Wait a bit for reactive updates
		setTimeout(() => {
			try {
				console.log('📊 State after reactive updates:', {
					startPosition: sequenceService.state?.startPosition?.letter,
					beats: sequenceService.state?.beats?.length || 0,
					isEmpty: sequenceService.isEmpty,
					isModified: sequenceService.state?.isModified
				});

				// Step 7: Check if ModernBeatGrid elements are updated
				const startPositionElements = document.querySelectorAll(
					'[data-start-position], .start-position-cell'
				);
				console.log('🔍 Start position elements found:', startPositionElements.length);

				startPositionElements.forEach((element, index) => {
					const htmlElement = element as HTMLElement;
					console.log(`🔍 Start position element ${index + 1}:`, {
						tagName: element.tagName,
						className: element.className,
						textContent: element.textContent?.trim(),
						dataset: htmlElement.dataset
					});
				});

				// Step 8: Test clearing
				console.log('🗑️ Testing clearSequence...');
				if (sequenceService.clearSequence && typeof sequenceService.clearSequence === 'function') {
					sequenceService.clearSequence();

					setTimeout(() => {
						console.log('📊 Final state after clearSequence:', {
							startPosition: sequenceService.state?.startPosition,
							beats: sequenceService.state?.beats?.length || 0,
							isEmpty: sequenceService.isEmpty,
							isModified: sequenceService.state?.isModified
						});

						console.log('✅ Browser reactive chain test completed!');
					}, 100);
				} else {
					console.error('❌ clearSequence method not available');
				}
			} catch (error) {
				console.error('❌ Error during reactive updates check:', error);
			}
		}, 100);

		return true;
	} catch (error) {
		console.error('❌ Error during browser reactive chain test:', error);
		return false;
	}
}

export function findStartPositionPickers() {
	console.log('🔍 Looking for StartPositionPicker components...');

	try {
		// Look for start position picker elements
		const startPosPickerElements = document.querySelectorAll(
			'.start-pos-picker, ' +
				'[data-start-position-picker], ' +
				'.pictograph-container[role="button"]'
		);

		console.log('🔍 Start position picker elements found:', startPosPickerElements.length);

		startPosPickerElements.forEach((element, index) => {
			const htmlElement = element as HTMLElement;
			console.log(`🔍 StartPositionPicker element ${index + 1}:`, {
				tagName: element.tagName,
				className: element.className,
				id: htmlElement.id,
				dataset: htmlElement.dataset,
				role: element.getAttribute('role'),
				tabindex: element.getAttribute('tabindex')
			});
		});

		return startPosPickerElements;
	} catch (error) {
		console.error('🔍 Error finding start position pickers:', error);
		return [];
	}
}

export function simulateStartPositionSelection() {
	console.log('🎯 Simulating start position selection...');

	try {
		const startPosElements = findStartPositionPickers();

		if (startPosElements.length === 0) {
			console.error('❌ No start position picker elements found');
			return false;
		}

		// Try to click the first clickable element
		const clickableElement = Array.from(startPosElements).find(
			(element) =>
				element.getAttribute('role') === 'button' ||
				element.tagName === 'BUTTON' ||
				element.getAttribute('tabindex') === '0'
		) as HTMLElement;

		if (!clickableElement) {
			console.error('❌ No clickable start position elements found');
			return false;
		}

		console.log('🎯 Clicking start position element:', clickableElement);

		// Simulate click
		clickableElement.click();

		// Wait for reactive updates
		setTimeout(() => {
			try {
				console.log('🎯 Checking state after simulated click...');
				const services = (window as any).__modernServices;
				if (services?.sequence) {
					console.log('📊 State after click:', {
						startPosition: services.sequence.state?.startPosition?.letter,
						beats: services.sequence.state?.beats?.length || 0,
						isEmpty: services.sequence.isEmpty,
						isModified: services.sequence.state?.isModified
					});
				}
			} catch (error) {
				console.error('🎯 Error checking state after click:', error);
			}
		}, 200);

		return true;
	} catch (error) {
		console.error('🎯 Error during start position selection simulation:', error);
		return false;
	}
}

// Auto-expose functions to window safely
if (typeof window !== 'undefined') {
	try {
		(window as any).testReactiveChainInBrowser = testReactiveChainInBrowser;
		(window as any).findStartPositionPickers = findStartPositionPickers;
		(window as any).simulateStartPositionSelection = simulateStartPositionSelection;

		console.log('🔧 Browser reactive test functions exposed:');
		console.log('  - window.testReactiveChainInBrowser()');
		console.log('  - window.findStartPositionPickers()');
		console.log('  - window.simulateStartPositionSelection()');
	} catch (error) {
		console.error('🔧 Error exposing browser reactive test functions:', error);
	}
}

declare global {
	interface Window {
		testReactiveChainInBrowser: typeof testReactiveChainInBrowser;
		findStartPositionPickers: typeof findStartPositionPickers;
		simulateStartPositionSelection: typeof simulateStartPositionSelection;
	}
}
