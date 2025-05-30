#!/usr/bin/env node

/**
 * Simple Effect Tester
 * Tests effects one by one and monitors for infinite loops
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';

const EFFECTS_TO_TEST = [
	{
		name: 'GoldSelectionBorder pulse effect (ACTIVE)',
		code: `
        // TEST EFFECT #1: GoldSelectionBorder pulse effect (CURRENTLY ACTIVE IN MAIN APP)
        let showPulse = $state(false);
        let isPulsing = false;

        $effect(() => {
            console.log('🔧 EFFECT #1: GoldSelectionBorder pulse effect - START');
            const pulseEffect = true; // Mock pulse trigger
            const active = beats.length > 0; // Mock active state

            if (pulseEffect && active && !isPulsing) {
                isPulsing = true;
                showPulse = true;
                console.log('🔧 EFFECT #1: Triggering pulse animation');

                // This setTimeout might be causing loops!
                setTimeout(() => {
                    showPulse = false;
                    isPulsing = false;
                    console.log('🔧 EFFECT #1: Pulse animation ended');
                }, 500);
            }
            console.log('🔧 EFFECT #1: GoldSelectionBorder pulse effect - END');
        });`
	},
	{
		name: 'BeatFrameGrid beat tracking',
		code: `
        // TEST EFFECT #2: BeatFrameGrid beat tracking
        let previousBeatIds = $state(new Set());
        let newlyAddedBeatIds = $state(new Set());

        $effect(() => {
            console.log('🔧 EFFECT #2: BeatFrameGrid beat tracking - START');
            const currentBeatIds = new Set();

            beats.forEach((beat) => {
                if (beat.letter) {
                    currentBeatIds.add(beat.letter);
                }
            });

            const newIds = new Set();
            currentBeatIds.forEach(id => {
                if (!previousBeatIds.has(id)) {
                    newIds.add(id);
                }
            });

            newlyAddedBeatIds = newIds;
            previousBeatIds = currentBeatIds;

            console.log('🔧 EFFECT #2: BeatFrameGrid beat tracking - END');
        });`
	},
	{
		name: 'Sequence state auto-save (ACTIVE)',
		code: `
        // TEST EFFECT #3: Sequence state auto-save (ACTIVE IN setupSequenceEffects)
        let isModified = $state(false);

        $effect(() => {
            console.log('🔧 EFFECT #3: Sequence auto-save - START');

            // Mock the isModified logic
            if (beats.length > 0) {
                isModified = true;
            }

            if (isModified) {
                console.log('🔧 EFFECT #3: Sequence modified, consider auto-saving');
                // This could trigger loops if it modifies state
            }
            console.log('🔧 EFFECT #3: Sequence auto-save - END');
        });`
	},
	{
		name: 'Sequence playback monitoring (ACTIVE)',
		code: `
        // TEST EFFECT #4: Sequence playback monitoring (ACTIVE IN setupSequenceEffects)
        let isPlaying = $state(false);
        let playbackPosition = $state(0);

        $effect(() => {
            console.log('🔧 EFFECT #4: Sequence playback monitoring - START');

            if (isPlaying) {
                console.log('🔧 EFFECT #4: Sequence is playing at position:', playbackPosition);
                // This could cause loops if it updates playback position
                playbackPosition = beats.length; // Mock playback update
            }
            console.log('🔧 EFFECT #4: Sequence playback monitoring - END');
        });`
	},
	{
		name: 'COMBINATION: setupSequenceEffects (ACTIVE)',
		code: `
        // TEST EFFECT #5: COMBINATION - Both setupSequenceEffects effects together
        let isModified = $state(false);
        let isPlaying = $state(false);
        let playbackPosition = $state(0);

        // EFFECT 1: Auto-save when modified (from setupSequenceEffects)
        $effect(() => {
            console.log('🔧 EFFECT #5A: setupSequenceEffects auto-save - START');

            // Mock the isModified logic that might trigger on beat changes
            if (beats.length > 0) {
                isModified = true;
            }

            if (isModified) {
                console.log('🔧 EFFECT #5A: Sequence modified, consider auto-saving');
                // This might trigger other effects or state changes
            }
            console.log('🔧 EFFECT #5A: setupSequenceEffects auto-save - END');
        });

        // EFFECT 2: Playback monitoring (from setupSequenceEffects)
        $effect(() => {
            console.log('🔧 EFFECT #5B: setupSequenceEffects playback - START');

            if (isPlaying) {
                console.log('🔧 EFFECT #5B: Sequence is playing at position:', playbackPosition);
                // This could cause loops if it updates playback position
                playbackPosition = beats.length;
            }
            console.log('🔧 EFFECT #5B: setupSequenceEffects playback - END');
        });`
	},
	{
		name: 'COMBINATION: All effects together',
		code: `
        // TEST EFFECT #6: ALL EFFECTS COMBINED - This should trigger loops!
        let showPulse = $state(false);
        let isPulsing = false;
        let previousBeatIds = $state(new Set());
        let newlyAddedBeatIds = $state(new Set());
        let isModified = $state(false);
        let isPlaying = $state(false);
        let playbackPosition = $state(0);

        // EFFECT 1: GoldSelectionBorder pulse
        $effect(() => {
            console.log('🔧 EFFECT #6A: Combined pulse - START');
            const pulseEffect = beats.length > 0;
            const active = beats.length > 0;

            if (pulseEffect && active && !isPulsing) {
                isPulsing = true;
                showPulse = true;
                setTimeout(() => {
                    showPulse = false;
                    isPulsing = false;
                }, 500);
            }
            console.log('🔧 EFFECT #6A: Combined pulse - END');
        });

        // EFFECT 2: Beat tracking
        $effect(() => {
            console.log('🔧 EFFECT #6B: Combined beat tracking - START');
            const currentBeatIds = new Set();
            beats.forEach((beat) => {
                if (beat.letter) {
                    currentBeatIds.add(beat.letter);
                }
            });

            const newIds = new Set();
            currentBeatIds.forEach(id => {
                if (!previousBeatIds.has(id)) {
                    newIds.add(id);
                }
            });

            newlyAddedBeatIds = newIds;
            previousBeatIds = currentBeatIds;
            console.log('🔧 EFFECT #6B: Combined beat tracking - END');
        });

        // EFFECT 3: Auto-save
        $effect(() => {
            console.log('🔧 EFFECT #6C: Combined auto-save - START');
            if (beats.length > 0) {
                isModified = true;
            }
            if (isModified) {
                console.log('🔧 EFFECT #6C: Auto-saving...');
            }
            console.log('🔧 EFFECT #6C: Combined auto-save - END');
        });

        // EFFECT 4: Playback
        $effect(() => {
            console.log('🔧 EFFECT #6D: Combined playback - START');
            if (isPlaying) {
                playbackPosition = beats.length;
            }
            console.log('🔧 EFFECT #6D: Combined playback - END');
        });`
	}
];

async function testEffect(effectIndex) {
	console.log(`\n🧪 Testing Effect ${effectIndex + 1}: ${EFFECTS_TO_TEST[effectIndex].name}`);

	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	let effectExecutions = 0;
	let infiniteLoopDetected = false;

	// Monitor console for infinite loops
	page.on('console', (msg) => {
		const text = msg.text();
		console.log(`[BROWSER] ${text}`);

		if (text.includes(`EFFECT #${effectIndex + 1}:`)) {
			effectExecutions++;
			console.log(`📊 Effect executions: ${effectExecutions}`);

			if (effectExecutions > 15) {
				console.log('🚨 INFINITE LOOP DETECTED - Too many executions!');
				infiniteLoopDetected = true;
			}
		}

		if (text.includes('effect_update_depth_exceeded')) {
			console.log('🚨 INFINITE LOOP DETECTED - Svelte error!');
			infiniteLoopDetected = true;
		}
	});

	try {
		// Add effect to test file
		await addEffectToTestFile(effectIndex);

		// Navigate to test page
		await page.goto('http://localhost:5179/nuclear-test');

		// Wait and monitor
		await page.waitForTimeout(3000);

		// Test interactions with proper selectors and detailed logging
		try {
			console.log('🖱️ Starting user interaction testing...');

			// Wait for page to fully load
			await page.waitForTimeout(2000);

			// Check if start position buttons are visible
			const startPosButtons = page.locator('.start-position-item');
			const startPosCount = await startPosButtons.count();
			console.log(`🔍 Found ${startPosCount} start position buttons`);

			if (startPosCount > 0) {
				console.log('🖱️ Clicking first start position button...');
				await startPosButtons.first().click();
				await page.waitForTimeout(1500);
				console.log('✅ Start position clicked');

				// Check if debug log updated
				const debugEntries = page.locator('.log-entry');
				const debugCount = await debugEntries.count();
				console.log(`📊 Debug log entries after start position click: ${debugCount}`);
			}

			// Check if option buttons are now visible
			const optionButtons = page.locator('.option-item');
			const optionCount = await optionButtons.count();
			console.log(`🔍 Found ${optionCount} option buttons`);

			if (optionCount > 0) {
				console.log('🖱️ Clicking first option button...');
				await optionButtons.first().click();
				await page.waitForTimeout(1500);
				console.log('✅ Option clicked');

				// Check if debug log updated again
				const debugEntries = page.locator('.log-entry');
				const debugCount = await debugEntries.count();
				console.log(`📊 Debug log entries after option click: ${debugCount}`);

				// Try clicking another option to trigger more effects
				if (optionCount > 1) {
					console.log('🖱️ Clicking second option button...');
					await optionButtons.nth(1).click();
					await page.waitForTimeout(1500);
					console.log('✅ Second option clicked');
				}
			}

			// Take a screenshot for debugging
			await page.screenshot({ path: `test-screenshot-effect-${effectIndex + 1}.png` });
			console.log(`📸 Screenshot saved: test-screenshot-effect-${effectIndex + 1}.png`);
		} catch (e) {
			console.log('❌ Interaction error:', e.message);
			console.log('📸 Taking error screenshot...');
			await page.screenshot({ path: `error-screenshot-effect-${effectIndex + 1}.png` });
		}

		await page.waitForTimeout(2000);
	} catch (error) {
		console.log('❌ Test error:', error.message);
		infiniteLoopDetected = true;
	} finally {
		await browser.close();
		await resetTestFile();
	}

	return {
		effectIndex,
		name: EFFECTS_TO_TEST[effectIndex].name,
		hasInfiniteLoop: infiniteLoopDetected,
		effectExecutions
	};
}

async function addEffectToTestFile(effectIndex) {
	const testFile = 'src/routes/nuclear-test/+page.svelte';
	const content = await fs.readFile(testFile, 'utf-8');

	const effect = EFFECTS_TO_TEST[effectIndex];
	const marker = '// 🚨 TESTING EFFECTS ONE BY ONE';
	const insertIndex = content.indexOf(marker);

	if (insertIndex === -1) {
		throw new Error('Could not find insertion marker');
	}

	const beforeMarker = content.substring(0, insertIndex + marker.length);
	const afterMarker = content.substring(content.indexOf('</script>', insertIndex));

	const newContent = beforeMarker + '\n' + effect.code + '\n' + afterMarker;

	await fs.writeFile(testFile, newContent, 'utf-8');
	console.log(`✅ Added effect to test file`);
}

async function resetTestFile() {
	const testFile = 'src/routes/nuclear-test/+page.svelte';
	const content = await fs.readFile(testFile, 'utf-8');

	const marker = '// 🚨 TESTING EFFECTS ONE BY ONE';
	const scriptEnd = '</script>';

	const markerIndex = content.indexOf(marker);
	const scriptEndIndex = content.indexOf(scriptEnd, markerIndex);

	if (markerIndex === -1 || scriptEndIndex === -1) {
		console.log('⚠️ Could not reset test file properly');
		return;
	}

	const beforeMarker = content.substring(0, markerIndex + marker.length);
	const afterScript = content.substring(scriptEndIndex);

	const resetContent =
		beforeMarker + '\n\t// Effects will be inserted here during testing\n' + afterScript;

	await fs.writeFile(testFile, resetContent, 'utf-8');
	console.log('🧹 Reset test file');
}

async function runAllTests() {
	console.log('🚀 Starting Autonomous Effect Testing...');

	const results = [];

	for (let i = 0; i < EFFECTS_TO_TEST.length; i++) {
		const result = await testEffect(i);
		results.push(result);

		if (result.hasInfiniteLoop) {
			console.log(`❌ FOUND PROBLEMATIC EFFECT: ${result.name}`);
			console.log(`📊 Effect executed ${result.effectExecutions} times before detection`);
			break;
		} else {
			console.log(`✅ Effect passed: ${result.name}`);
		}

		// Wait between tests
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}

	// Generate report
	console.log('\n📊 FINAL REPORT:');
	console.log('='.repeat(50));

	const passed = results.filter((r) => !r.hasInfiniteLoop);
	const failed = results.filter((r) => r.hasInfiniteLoop);

	console.log(`✅ Passed: ${passed.length}`);
	console.log(`❌ Failed: ${failed.length}`);

	if (failed.length > 0) {
		console.log('\n🚨 PROBLEMATIC EFFECTS:');
		failed.forEach((f) => {
			console.log(`- ${f.name} (${f.effectExecutions} executions)`);
		});

		console.log('\n🔧 RECOMMENDED FIXES:');
		failed.forEach((f) => {
			console.log(`\nFIX FOR: ${f.name}`);
			if (f.name.includes('beat tracking')) {
				console.log('  Solution: Use untrack() around state mutations');
				console.log('  Code: untrack(() => { newlyAddedBeatIds = newIds; });');
			} else if (f.name.includes('loading')) {
				console.log('  Solution: Add guards to prevent unnecessary executions');
				console.log('  Code: if (isCurrentlyLoading) return;');
			} else {
				console.log('  Solution: Replace with direct function calls');
			}
		});
	}

	// Save detailed report
	await fs.writeFile('effect-test-results.json', JSON.stringify(results, null, 2));
	console.log('\n📄 Detailed results saved to: effect-test-results.json');
}

// Run the tests
runAllTests().catch(console.error);
