/**
 * Manual Test Script for Reactivity Chain
 * Run this in browser console to test the fixed reactivity chain
 */

// Test the complete reactivity chain
export function testReactivityChain() {
	console.log('🧪 TESTING REACTIVITY CHAIN');

	// Step 1: Check initial state
	console.log('1️⃣ Initial sequenceState.isEmpty:', window.sequenceState?.isEmpty);
	console.log('1️⃣ Initial sequenceState.startPosition:', window.sequenceState?.startPosition);

	// Step 2: Create a mock start position
	const mockStartPosition = {
		letter: 'A',
		startPos: 'alpha1',
		endPos: 'alpha1',
		timing: 'static',
		direction: 'cw',
		gridMode: 'diamond',
		gridData: null,
		redPropData: null,
		bluePropData: null,
		redMotionData: {
			id: 'red-test',
			motionType: 'static',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'no_rot',
			startLoc: 's',
			endLoc: 's',
			turns: 0,
			color: 'red',
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
		},
		blueMotionData: {
			id: 'blue-test',
			motionType: 'static',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'no_rot',
			startLoc: 's',
			endLoc: 's',
			turns: 0,
			color: 'blue',
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
		},
		redArrowData: null,
		blueArrowData: null,
		grid: 'diamond',
		isStartPosition: true
	};

	// Step 3: Set start position and watch the chain
	console.log('2️⃣ Setting start position...');
	window.sequenceState?.setStartPosition(mockStartPosition);

	// Step 4: Check state after setting
	setTimeout(() => {
		console.log('3️⃣ After setting - sequenceState.isEmpty:', window.sequenceState?.isEmpty);
		console.log(
			'3️⃣ After setting - sequenceState.startPosition:',
			window.sequenceState?.startPosition
		);

		// Step 5: Check if OptionPicker switched
		const startPosPicker = document.querySelector('.start-pos-picker');
		const optionPickerMain = document.querySelector('.option-picker-main');

		console.log(
			'4️⃣ StartPositionPicker visible:',
			!!startPosPicker && startPosPicker.style.display !== 'none'
		);
		console.log(
			'4️⃣ OptionPickerMain visible:',
			!!optionPickerMain && optionPickerMain.style.display !== 'none'
		);

		// Step 6: Check if BeatFrame shows start position
		const startPosBeat = document.querySelector('.start-pos-beat');
		const pictographInBeat = startPosBeat?.querySelector('.pictograph');
		const arrowsInBeat = pictographInBeat?.querySelectorAll('image[data-testid*="arrow"]');

		console.log('5️⃣ StartPosBeat found:', !!startPosBeat);
		console.log('5️⃣ Pictograph in beat:', !!pictographInBeat);
		console.log('5️⃣ Arrows in beat:', arrowsInBeat?.length || 0);

		// Step 7: Summary
		const chainWorking =
			!window.sequenceState?.isEmpty &&
			!!window.sequenceState?.startPosition &&
			!!optionPickerMain &&
			!!pictographInBeat &&
			(arrowsInBeat?.length || 0) > 0;

		console.log('✅ REACTIVITY CHAIN WORKING:', chainWorking);

		if (!chainWorking) {
			console.log('❌ Chain broken at:');
			if (window.sequenceState?.isEmpty) console.log('  - sequenceState.isEmpty still true');
			if (!window.sequenceState?.startPosition) console.log('  - startPosition not set');
			if (!optionPickerMain) console.log('  - OptionPickerMain not visible');
			if (!pictographInBeat) console.log('  - Pictograph not rendered in beat');
			if ((arrowsInBeat?.length || 0) === 0) console.log('  - Arrows not visible');
		}

		return chainWorking;
	}, 1000);
}

// Test arrow visibility specifically
export function testArrowVisibility() {
	console.log('🏹 TESTING ARROW VISIBILITY');

	const pictographs = document.querySelectorAll('.pictograph');
	let totalArrows = 0;

	pictographs.forEach((pictograph, index) => {
		const arrows = pictograph.querySelectorAll('image[data-testid*="arrow"]');
		console.log(`Pictograph ${index + 1}: ${arrows.length} arrows`);
		totalArrows += arrows.length;
	});

	console.log(`Total arrows visible: ${totalArrows}`);
	return totalArrows;
}

// Test clicking a start position in the UI
export function testStartPositionClick() {
	console.log('🧪 TESTING START POSITION CLICK');

	// Find the first start position in the picker
	const startPositions = document.querySelectorAll('.start-pos-picker .pictograph-container');

	if (startPositions.length === 0) {
		console.log('❌ No start positions found in picker');
		return false;
	}

	console.log(`Found ${startPositions.length} start positions`);

	// Click the first one
	const firstStartPos = startPositions[0] as HTMLElement;
	console.log('🖱️ Clicking first start position...');
	firstStartPos.click();

	// Wait and check results
	setTimeout(() => {
		console.log('📊 Checking results after click...');

		// Check if OptionPicker switched
		const startPosPicker = document.querySelector('.start-pos-picker');
		const optionPickerMain = document.querySelector('.option-picker-main');

		console.log(
			'StartPositionPicker visible:',
			!!startPosPicker && !startPosPicker.closest('[style*="display: none"]')
		);
		console.log(
			'OptionPickerMain visible:',
			!!optionPickerMain && !optionPickerMain.closest('[style*="display: none"]')
		);

		// Check if beat frame shows start position
		const startPosBeat = document.querySelector('.start-pos-beat');
		const pictographInBeat = startPosBeat?.querySelector('.pictograph');
		const arrowsInBeat = pictographInBeat?.querySelectorAll('image[data-testid*="arrow"]');

		console.log('StartPosBeat found:', !!startPosBeat);
		console.log('Pictograph in beat:', !!pictographInBeat);
		console.log('Arrows in beat:', arrowsInBeat?.length || 0);

		// Check sequence state
		console.log('sequenceState.isEmpty:', window.sequenceState?.isEmpty);
		console.log('sequenceState.startPosition exists:', !!window.sequenceState?.startPosition);

		const success =
			!!optionPickerMain &&
			!window.sequenceState?.isEmpty &&
			!!window.sequenceState?.startPosition &&
			!!pictographInBeat &&
			(arrowsInBeat?.length || 0) > 0;

		console.log(
			success ? '✅ START POSITION CLICK TEST PASSED' : '❌ START POSITION CLICK TEST FAILED'
		);
		return success;
	}, 1000);
}

// Test current state without clicking
export function testCurrentState() {
	console.log('🔍 TESTING CURRENT STATE');

	// Check current UI state
	const startPosPicker = document.querySelector('.start-pos-picker');
	const optionPickerMain = document.querySelector('.option-picker-main');
	const startPosBeat = document.querySelector('.start-pos-beat');
	const pictographInBeat = startPosBeat?.querySelector('.pictograph');
	const arrowsInBeat = pictographInBeat?.querySelectorAll('image[data-testid*="arrow"]');

	console.log('🎯 Current UI State:');
	console.log(
		'  StartPositionPicker visible:',
		!!startPosPicker && getComputedStyle(startPosPicker).display !== 'none'
	);
	console.log(
		'  OptionPickerMain visible:',
		!!optionPickerMain && getComputedStyle(optionPickerMain).display !== 'none'
	);
	console.log('  StartPosBeat found:', !!startPosBeat);
	console.log('  Pictograph in beat:', !!pictographInBeat);
	console.log('  Arrows in beat:', arrowsInBeat?.length || 0);

	console.log('🎯 Current State:');
	console.log('  sequenceState.isEmpty:', window.sequenceState?.isEmpty);
	console.log('  sequenceState.startPosition exists:', !!window.sequenceState?.startPosition);

	if (window.sequenceState?.startPosition) {
		console.log('  Start position letter:', window.sequenceState.startPosition.letter);
		console.log('  Start position pos:', window.sequenceState.startPosition.startPos);
	}

	// Check all pictographs for arrows
	const allPictographs = document.querySelectorAll('.pictograph');
	let totalArrows = 0;
	allPictographs.forEach((pictograph, index) => {
		const arrows = pictograph.querySelectorAll('image[data-testid*="arrow"]');
		if (arrows.length > 0) {
			console.log(`  Pictograph ${index + 1}: ${arrows.length} arrows`);
			totalArrows += arrows.length;
		}
	});

	console.log(`🏹 Total arrows visible across all pictographs: ${totalArrows}`);

	const reactivityWorking = !window.sequenceState?.isEmpty && !!window.sequenceState?.startPosition;
	const uiWorking = !!optionPickerMain && !!pictographInBeat;
	const arrowsWorking = totalArrows > 0;

	console.log('📊 Summary:');
	console.log('  ✅ Reactivity working:', reactivityWorking);
	console.log('  ✅ UI switching working:', uiWorking);
	console.log('  ✅ Arrows visible:', arrowsWorking);

	return { reactivityWorking, uiWorking, arrowsWorking, totalArrows };
}

// Make functions available globally for manual testing
if (typeof window !== 'undefined') {
	window.testReactivityChain = testReactivityChain;
	window.testArrowVisibility = testArrowVisibility;
	window.testStartPositionClick = testStartPositionClick;
	window.testCurrentState = testCurrentState;
}
