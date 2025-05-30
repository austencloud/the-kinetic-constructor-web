/**
 * Comprehensive Start Position Selection Flow Debugger
 * This script will trace every stage of the start position selection process
 */

import { chromium } from 'playwright';

async function debugStartPositionFlow() {
	console.log('🔍 Starting comprehensive start position flow debugging...');

	const browser = await chromium.launch({
		headless: false,
		devtools: true // Open DevTools automatically
	});
	const page = await browser.newPage();

	// Capture all console messages with detailed categorization
	const logs = [];
	page.on('console', (msg) => {
		const timestamp = new Date().toISOString();
		const logEntry = {
			timestamp,
			type: msg.type(),
			text: msg.text(),
			category: categorizeLog(msg.text())
		};
		logs.push(logEntry);

		// Real-time logging with color coding
		const color = getLogColor(logEntry.category);
		console.log(`${color}[${timestamp}] [${logEntry.category}] ${msg.text()}\x1b[0m`);
	});

	// Capture page errors
	page.on('pageerror', (error) => {
		console.log('\x1b[31m❌ PAGE ERROR:', error.message, '\x1b[0m');
	});

	try {
		console.log('🌐 Navigating to application...');
		await page.goto('http://localhost:5179', { waitUntil: 'networkidle' });

		console.log('⏳ Waiting for initial page load...');
		await page.waitForTimeout(3000);

		// Phase 1: Initial State Analysis
		console.log('\n📊 PHASE 1: INITIAL STATE ANALYSIS');
		await analyzeInitialState(page);

		// Phase 2: Start Position Picker Analysis
		console.log('\n🎯 PHASE 2: START POSITION PICKER ANALYSIS');
		const startPositionButton = await findStartPositionButton(page);

		if (!startPositionButton) {
			console.log('❌ No start position button found - cannot proceed with test');
			return;
		}

		// Phase 3: Pre-Click State Capture
		console.log('\n📸 PHASE 3: PRE-CLICK STATE CAPTURE');
		const preClickState = await captureApplicationState(page);
		console.log('Pre-click state captured:', JSON.stringify(preClickState, null, 2));

		// Phase 4: Click Event and Immediate Response
		console.log('\n🖱️ PHASE 4: CLICK EVENT AND IMMEDIATE RESPONSE');
		const clickTimestamp = Date.now();

		// Clear previous logs to focus on click response
		logs.length = 0;

		await startPositionButton.click();
		console.log('✅ Start position button clicked');

		// Wait for immediate response
		await page.waitForTimeout(1000);

		// Phase 5: Post-Click State Analysis
		console.log('\n📈 PHASE 5: POST-CLICK STATE ANALYSIS');
		const postClickState = await captureApplicationState(page);
		console.log('Post-click state captured:', JSON.stringify(postClickState, null, 2));

		// Phase 6: Event Flow Analysis
		console.log('\n🔄 PHASE 6: EVENT FLOW ANALYSIS');
		analyzeEventFlow(logs, clickTimestamp);

		// Phase 7: State Comparison
		console.log('\n⚖️ PHASE 7: STATE COMPARISON');
		compareStates(preClickState, postClickState);

		// Phase 8: Visual Rendering Verification
		console.log('\n👁️ PHASE 8: VISUAL RENDERING VERIFICATION');
		await verifyVisualRendering(page);

		// Phase 9: Wait for delayed updates
		console.log('\n⏰ PHASE 9: DELAYED UPDATES CHECK');
		await page.waitForTimeout(3000);
		const finalState = await captureApplicationState(page);
		console.log('Final state after delay:', JSON.stringify(finalState, null, 2));

		// Phase 10: Summary and Recommendations
		console.log('\n📋 PHASE 10: SUMMARY AND RECOMMENDATIONS');
		generateSummary(preClickState, postClickState, finalState, logs);

		console.log('\n🔍 Browser will remain open for manual inspection. Press Ctrl+C to close.');

		// Keep browser open for manual inspection
		await new Promise(() => {});
	} catch (error) {
		console.log('❌ Debug session failed:', error.message);
	} finally {
		// Don't close browser automatically for manual inspection
		// await browser.close();
	}
}

function categorizeLog(text) {
	if (text.includes('start-position-selected')) return 'EVENT';
	if (text.includes('StartPosBeat')) return 'START_POS_BEAT';
	if (text.includes('TKAGlyph')) return 'GLYPH';
	if (text.includes('PictographComponentManager')) return 'COMPONENT_MANAGER';
	if (text.includes('Prop')) return 'PROP';
	if (text.includes('Arrow')) return 'ARROW';
	if (text.includes('effect_update_depth_exceeded')) return 'INFINITE_LOOP';
	if (text.includes('ERROR') || text.includes('Error')) return 'ERROR';
	if (text.includes('SYSTEMATIC TEST')) return 'SYSTEMATIC_TEST';
	return 'GENERAL';
}

function getLogColor(category) {
	const colors = {
		EVENT: '\x1b[32m', // Green
		START_POS_BEAT: '\x1b[34m', // Blue
		GLYPH: '\x1b[35m', // Magenta
		COMPONENT_MANAGER: '\x1b[36m', // Cyan
		PROP: '\x1b[33m', // Yellow
		ARROW: '\x1b[37m', // White
		INFINITE_LOOP: '\x1b[31m', // Red
		ERROR: '\x1b[31m', // Red
		SYSTEMATIC_TEST: '\x1b[90m', // Gray
		GENERAL: '\x1b[0m' // Default
	};
	return colors[category] || '\x1b[0m';
}

async function analyzeInitialState(page) {
	// Check if start position picker is visible
	const pickerVisible = await page
		.locator('.start-position-picker')
		.isVisible()
		.catch(() => false);
	console.log(`Start position picker visible: ${pickerVisible}`);

	// Check if start position beat frame exists
	const beatFrameVisible = await page
		.locator('.start-position-beat')
		.isVisible()
		.catch(() => false);
	console.log(`Start position beat frame visible: ${beatFrameVisible}`);

	// Check current sequence state
	const sequenceState = await page.evaluate(() => {
		return window.sequenceState
			? {
					hasStartPosition: !!window.sequenceState.startPosition,
					beatsCount: window.sequenceState.beats?.length || 0
				}
			: null;
	});
	console.log('Initial sequence state:', sequenceState);
}

async function findStartPositionButton(page) {
	const selectors = [
		'[data-testid="start-position-A"]',
		'.start-position-option:first-child',
		'.pictograph-option:first-child',
		'.option-button:first-child',
		'button:has-text("A")'
	];

	for (const selector of selectors) {
		try {
			const button = page.locator(selector).first();
			if (await button.isVisible({ timeout: 1000 })) {
				console.log(`✅ Found start position button with selector: ${selector}`);
				return button;
			}
		} catch (e) {
			// Continue to next selector
		}
	}

	console.log('❌ No start position button found with any selector');
	return null;
}

async function captureApplicationState(page) {
	return await page.evaluate(() => {
		const state = {
			timestamp: Date.now(),
			sequenceState: null,
			startPosBeatData: null,
			pictographData: null,
			localStorage: null,
			domElements: {
				startPositionBeat: null,
				glyphs: [],
				props: [],
				arrows: []
			},
			sequenceIsEmpty: null,
			beatFrameGridState: null
		};

		// Capture sequence state
		if (window.sequenceState) {
			state.sequenceState = {
				hasStartPosition: !!window.sequenceState.startPosition,
				startPositionLetter: window.sequenceState.startPosition?.letter,
				beatsCount: window.sequenceState.beats?.length || 0,
				isEmpty: window.sequenceState.isEmpty
			};
		}

		// Capture sequenceIsEmpty from BeatFrameStateManager if available
		if (window.beatFrameStateManager) {
			const stateManagerState = window.beatFrameStateManager.getState();
			state.sequenceIsEmpty = stateManagerState.sequenceIsEmpty;
			state.beatFrameGridState = {
				sequenceIsEmpty: stateManagerState.sequenceIsEmpty,
				hasStartPosition: !!stateManagerState.startPosition,
				startPositionLetter: stateManagerState.startPosition?.letter
			};
		}

		// Capture localStorage
		try {
			const startPosData = localStorage.getItem('start_position');
			state.localStorage = startPosData ? JSON.parse(startPosData) : null;
		} catch (e) {
			state.localStorage = 'ERROR';
		}

		// Capture DOM elements - check multiple possible selectors
		const startPosBeatSelectors = ['.start-pos-beat', '.start-position-beat', '.start-position'];
		let startPosBeat = null;

		for (const selector of startPosBeatSelectors) {
			startPosBeat = document.querySelector(selector);
			if (startPosBeat) break;
		}

		if (startPosBeat) {
			state.domElements.startPositionBeat = {
				exists: true,
				hasContent: startPosBeat.children.length > 0,
				childrenCount: startPosBeat.children.length,
				className: startPosBeat.className,
				selector: startPosBeatSelectors.find((s) => document.querySelector(s))
			};
		}

		// Count visual elements
		state.domElements.glyphs = Array.from(document.querySelectorAll('.tka-glyph')).length;
		state.domElements.props = Array.from(document.querySelectorAll('.prop')).length;
		state.domElements.arrows = Array.from(document.querySelectorAll('.arrow')).length;

		return state;
	});
}

function analyzeEventFlow(logs, clickTimestamp) {
	const relevantLogs = logs.filter(
		(log) =>
			log.category === 'EVENT' ||
			log.category === 'START_POS_BEAT' ||
			log.category === 'COMPONENT_MANAGER'
	);

	console.log(`Found ${relevantLogs.length} relevant logs after click:`);
	relevantLogs.forEach((log) => {
		const timeDiff = new Date(log.timestamp).getTime() - clickTimestamp;
		console.log(`  +${timeDiff}ms: [${log.category}] ${log.text}`);
	});
}

function compareStates(preClick, postClick) {
	console.log('State changes detected:');

	// Compare sequence state
	if (JSON.stringify(preClick.sequenceState) !== JSON.stringify(postClick.sequenceState)) {
		console.log('  ✅ Sequence state changed');
		console.log('    Before:', preClick.sequenceState);
		console.log('    After:', postClick.sequenceState);
	} else {
		console.log('  ❌ Sequence state unchanged');
	}

	// Compare localStorage
	if (JSON.stringify(preClick.localStorage) !== JSON.stringify(postClick.localStorage)) {
		console.log('  ✅ localStorage changed');
		console.log('    Before:', preClick.localStorage);
		console.log('    After:', postClick.localStorage);
	} else {
		console.log('  ❌ localStorage unchanged');
	}

	// Compare DOM elements
	const domChanged = JSON.stringify(preClick.domElements) !== JSON.stringify(postClick.domElements);
	if (domChanged) {
		console.log('  ✅ DOM elements changed');
		console.log('    Before:', preClick.domElements);
		console.log('    After:', postClick.domElements);
	} else {
		console.log('  ❌ DOM elements unchanged');
	}
}

async function verifyVisualRendering(page) {
	// Check for visual elements in the start position beat
	const visualElements = await page.evaluate(() => {
		const startPosBeatSelectors = ['.start-pos-beat', '.start-position-beat', '.start-position'];
		let startPosBeat = null;

		for (const selector of startPosBeatSelectors) {
			startPosBeat = document.querySelector(selector);
			if (startPosBeat) break;
		}

		if (!startPosBeat) {
			return {
				error: 'Start position beat not found',
				availableElements: {
					startPosBeat: document.querySelectorAll('.start-pos-beat').length,
					startPositionBeat: document.querySelectorAll('.start-position-beat').length,
					startPosition: document.querySelectorAll('.start-position').length,
					beatContainers: document.querySelectorAll('.beat-container').length
				}
			};
		}

		return {
			foundWith: startPosBeatSelectors.find((s) => document.querySelector(s)),
			glyphsInBeat: startPosBeat.querySelectorAll('.tka-glyph').length,
			propsInBeat: startPosBeat.querySelectorAll('.prop').length,
			arrowsInBeat: startPosBeat.querySelectorAll('.arrow').length,
			svgElements: startPosBeat.querySelectorAll('svg').length,
			imageElements: startPosBeat.querySelectorAll('image').length,
			innerHTML: startPosBeat.innerHTML.length > 100 ? 'HAS_CONTENT' : 'EMPTY',
			className: startPosBeat.className
		};
	});

	console.log('Visual elements in start position beat:', visualElements);
}

function generateSummary(preClick, postClick, finalState, logs) {
	console.log('='.repeat(60));
	console.log('DEBUGGING SUMMARY');
	console.log('='.repeat(60));

	// Check if events were dispatched
	const eventLogs = logs.filter((log) => log.category === 'EVENT');
	console.log(`Events dispatched: ${eventLogs.length > 0 ? '✅' : '❌'}`);

	// Check if state updated
	const stateChanged =
		JSON.stringify(preClick.sequenceState) !== JSON.stringify(postClick.sequenceState);
	console.log(`State updated: ${stateChanged ? '✅' : '❌'}`);

	// Check if localStorage updated
	const localStorageChanged =
		JSON.stringify(preClick.localStorage) !== JSON.stringify(postClick.localStorage);
	console.log(`localStorage updated: ${localStorageChanged ? '✅' : '❌'}`);

	// Check if visual elements rendered
	const visualElementsRendered =
		finalState.domElements.glyphs > 0 || finalState.domElements.props > 0;
	console.log(`Visual elements rendered: ${visualElementsRendered ? '✅' : '❌'}`);

	// Check for infinite loops
	const infiniteLoops = logs.filter((log) => log.category === 'INFINITE_LOOP');
	console.log(`Infinite loops detected: ${infiniteLoops.length > 0 ? '❌' : '✅'}`);

	console.log('\nRECOMMENDATIONS:');
	if (eventLogs.length === 0) {
		console.log('- Event dispatch mechanism may be broken');
	}
	if (!stateChanged) {
		console.log('- State management system may not be responding to events');
	}
	if (!localStorageChanged) {
		console.log('- localStorage persistence may be disabled');
	}
	if (!visualElementsRendered) {
		console.log('- Visual rendering pipeline may be broken');
	}
	if (infiniteLoops.length > 0) {
		console.log('- Infinite loops are still occurring and may be blocking updates');
	}
}

// Run the debug session
debugStartPositionFlow().catch(console.error);
