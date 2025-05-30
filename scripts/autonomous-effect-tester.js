#!/usr/bin/env node

/**
 * Autonomous Effect Tester
 * 
 * This script systematically tests each $effect from your main codebase
 * by adding them one by one to the nuclear test and monitoring for infinite loops.
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

class AutonomousEffectTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.effectsToTest = [];
        this.currentEffectIndex = 0;
        this.baseTestFile = 'src/routes/nuclear-test/+page.svelte';
        this.testUrl = 'http://localhost:5179/nuclear-test';
        this.maxEffectExecutions = 20; // Threshold for detecting infinite loops
        this.testTimeout = 10000; // 10 seconds per test
    }

    async initialize() {
        console.log('🚀 Initializing Autonomous Effect Tester...');
        
        // Launch browser with console access
        this.browser = await chromium.launch({
            headless: false, // Keep visible for debugging
            devtools: true,
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });
        
        this.page = await this.browser.newPage();
        
        // Set up console monitoring
        this.setupConsoleMonitoring();
        
        // Load effects to test
        await this.loadEffectsToTest();
        
        console.log(`📋 Found ${this.effectsToTest.length} effects to test`);
    }

    setupConsoleMonitoring() {
        this.page.on('console', (msg) => {
            const text = msg.text();
            const type = msg.type();
            
            // Log all console messages with timestamp
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${type.toUpperCase()}] ${text}`);
            
            // Check for infinite loop indicators
            if (text.includes('effect_update_depth_exceeded') || 
                text.includes('INFINITE LOOP DETECTED') ||
                text.includes('Maximum update depth exceeded')) {
                this.handleInfiniteLoopDetected(text);
            }
        });

        this.page.on('pageerror', (error) => {
            console.error(`❌ Page Error: ${error.message}`);
            this.handleInfiniteLoopDetected(error.message);
        });
    }

    async loadEffectsToTest() {
        // Define the effects we want to test from your codebase
        this.effectsToTest = [
            {
                name: 'BeatFrameGrid beat tracking',
                file: 'src/lib/components/SequenceWorkbench/BeatFrame/components/BeatFrameGrid.svelte',
                lineNumber: 40,
                code: `
                // Track which beats are newly added (from BeatFrameGrid.svelte line 40)
                let previousBeatIds = $state<Set<string>>(new Set());
                let newlyAddedBeatIds = $state<Set<string>>(new Set());
                
                $effect(() => {
                    console.log('🔧 TESTING: BeatFrameGrid beat tracking effect');
                    const currentBeatIds = new Set<string>();
                    
                    beats.forEach((beat) => {
                        if (beat.letter) {
                            currentBeatIds.add(beat.letter);
                        }
                    });
                    
                    const newIds = new Set<string>();
                    currentBeatIds.forEach(id => {
                        if (!previousBeatIds.has(id)) {
                            newIds.add(id);
                        }
                    });
                    
                    newlyAddedBeatIds = newIds;
                    previousBeatIds = currentBeatIds;
                    
                    console.log('🔧 Beat tracking effect completed');
                });`
            },
            {
                name: 'OptionPickerMain loading state',
                file: 'src/lib/components/ConstructTab/OptionPicker/components/OptionPickerMain.svelte',
                lineNumber: 122,
                code: `
                $effect(() => {
                    console.log('🔧 TESTING: OptionPickerMain loading state effect');
                    const currentIsLoading = false; // Mock loading state
                    const currentDisplayOptions = beats; // Use beats as mock options
                    
                    if (!currentIsLoading && currentDisplayOptions && currentDisplayOptions.length > 0) {
                        console.log('🔧 Loading state effect: Options loaded');
                    }
                    console.log('🔧 Loading state effect completed');
                });`
            },
            {
                name: 'Sequence state monitoring',
                file: 'Mock sequence monitoring effect',
                lineNumber: 0,
                code: `
                $effect(() => {
                    console.log('🔧 TESTING: Sequence state monitoring effect');
                    const currentStartPos = startPosition;
                    const currentBeats = beats;
                    const currentIsEmpty = isEmpty;
                    
                    console.log('🔧 Sequence monitoring:', {
                        hasStartPos: !!currentStartPos,
                        beatCount: currentBeats.length,
                        isEmpty: currentIsEmpty
                    });
                    console.log('🔧 Sequence monitoring effect completed');
                });`
            },
            {
                name: 'Options refresh on sequence change',
                file: 'Mock options refresh effect',
                lineNumber: 0,
                code: `
                let lastBeatCount = $state(0);
                $effect(() => {
                    console.log('🔧 TESTING: Options refresh on sequence change effect');
                    const currentBeatCount = beats.length;
                    
                    if (currentBeatCount !== lastBeatCount) {
                        console.log('🔧 Beat count changed, refreshing options');
                        lastBeatCount = currentBeatCount;
                        
                        // Simulate options refresh that might cause loops
                        if (currentBeatCount > 0) {
                            console.log('🔧 Options refreshed based on sequence');
                        }
                    }
                    console.log('🔧 Options refresh effect completed');
                });`
            }
        ];
    }

    async runTests() {
        console.log('🧪 Starting autonomous effect testing...');
        
        for (let i = 0; i < this.effectsToTest.length; i++) {
            this.currentEffectIndex = i;
            const effect = this.effectsToTest[i];
            
            console.log(`\n📝 Testing Effect ${i + 1}/${this.effectsToTest.length}: ${effect.name}`);
            
            const result = await this.testSingleEffect(effect);
            this.testResults.push(result);
            
            if (result.hasInfiniteLoop) {
                console.log(`❌ INFINITE LOOP DETECTED in effect: ${effect.name}`);
                console.log(`📍 Location: ${effect.file}:${effect.lineNumber}`);
                break;
            } else {
                console.log(`✅ Effect passed: ${effect.name}`);
            }
            
            // Wait between tests
            await this.delay(2000);
        }
        
        await this.generateReport();
    }

    async testSingleEffect(effect) {
        const result = {
            name: effect.name,
            file: effect.file,
            lineNumber: effect.lineNumber,
            hasInfiniteLoop: false,
            errorMessages: [],
            consoleOutput: [],
            testDuration: 0
        };
        
        const startTime = Date.now();
        
        try {
            // Add the effect to the nuclear test
            await this.addEffectToTest(effect);
            
            // Navigate to test page and monitor
            await this.page.goto(this.testUrl, { waitUntil: 'networkidle' });
            
            // Monitor for infinite loops
            const loopDetected = await this.monitorForInfiniteLoops();
            result.hasInfiniteLoop = loopDetected;
            
            // Test user interactions
            await this.testUserInteractions();
            
        } catch (error) {
            console.error(`❌ Error testing effect ${effect.name}:`, error.message);
            result.errorMessages.push(error.message);
            result.hasInfiniteLoop = true;
        } finally {
            result.testDuration = Date.now() - startTime;
            
            // Remove the effect from test (reset for next test)
            await this.removeEffectFromTest();
        }
        
        return result;
    }

    async addEffectToTest(effect) {
        console.log(`📝 Adding effect to nuclear test: ${effect.name}`);
        
        // Read current test file
        const testContent = await fs.readFile(this.baseTestFile, 'utf-8');
        
        // Find the insertion point (after the existing effects section)
        const insertionMarker = '// 🚨 TESTING EFFECTS ONE BY ONE';
        const insertionIndex = testContent.indexOf(insertionMarker);
        
        if (insertionIndex === -1) {
            throw new Error('Could not find insertion marker in test file');
        }
        
        // Insert the new effect
        const beforeInsertion = testContent.substring(0, insertionIndex + insertionMarker.length);
        const afterInsertion = testContent.substring(testContent.indexOf('</script>', insertionIndex));
        
        const newContent = beforeInsertion + '\n\n' + effect.code + '\n' + afterInsertion;
        
        // Write the modified file
        await fs.writeFile(this.baseTestFile, newContent, 'utf-8');
        
        console.log(`✅ Effect added to test file`);
    }

    async removeEffectFromTest() {
        console.log('🧹 Removing effect from nuclear test');
        
        // Reset to base test file without the added effect
        // This is a simplified approach - in practice you might want to keep a backup
        const baseContent = await this.getBaseTestContent();
        await fs.writeFile(this.baseTestFile, baseContent, 'utf-8');
    }

    async getBaseTestContent() {
        // Return the base nuclear test content without any added effects
        // This should be the working version we established
        return `<!-- NUCLEAR REBUILD: Minimal working version of your app -->
<script lang="ts">
	// 🚨 NUCLEAR: Single source of truth - no multiple state systems
	import type { PictographData } from '$lib/types/PictographData';
	
	// 🚨 NUCLEAR: Minimal state that matches your exact data structures
	let startPosition = $state<PictographData | null>(null);
	let beats = $state<PictographData[]>([]);
	let debugLog = $state<string[]>([]);
	
	// 🚨 CRITICAL: Match your isEmpty logic exactly
	let isEmpty = $derived(!startPosition && beats.length === 0);
	
	// Mock data for testing
	const mockStartPositions = [
		{ letter: 'α1', startPos: 'alpha1', endPos: 'alpha1' },
		{ letter: 'β5', startPos: 'beta5', endPos: 'beta5' }
	];
	
	const mockOptions = [
		{ letter: 'A', startPos: 'alpha1', endPos: 'beta2' },
		{ letter: 'B', startPos: 'alpha1', endPos: 'gamma3' }
	];
	
	// 🚨 NUCLEAR: Direct functions - no reactive chains
	function setStartPosition(startPos) {
		console.log('Setting start position:', startPos.letter);
		startPosition = { ...startPos };
	}
	
	function addBeat(beat) {
		console.log('Adding beat:', beat.letter);
		beats = [...beats, { ...beat }];
	}
	
	function clearSequence() {
		console.log('Clearing sequence');
		startPosition = null;
		beats = [];
	}
	
	// 🚨 TESTING EFFECTS ONE BY ONE
	// Effects will be inserted here during testing
</script>

<!-- Template content here -->`;
    }

    async monitorForInfiniteLoops() {
        console.log('👀 Monitoring for infinite loops...');
        
        let effectExecutionCount = 0;
        let loopDetected = false;
        
        // Set up a promise that resolves when we detect a loop or timeout
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⏰ Test timeout reached - no infinite loop detected');
                resolve(false);
            }, this.testTimeout);
            
            // Monitor console messages for effect executions
            const consoleHandler = (msg) => {
                const text = msg.text();
                
                if (text.includes('🔧 TESTING:') || text.includes('effect completed')) {
                    effectExecutionCount++;
                    console.log(`📊 Effect execution count: ${effectExecutionCount}`);
                    
                    if (effectExecutionCount > this.maxEffectExecutions) {
                        console.log('🚨 Infinite loop detected - too many effect executions');
                        loopDetected = true;
                        clearTimeout(timeout);
                        resolve(true);
                    }
                }
                
                if (text.includes('effect_update_depth_exceeded') || 
                    text.includes('INFINITE LOOP DETECTED')) {
                    console.log('🚨 Infinite loop detected - error message found');
                    loopDetected = true;
                    clearTimeout(timeout);
                    resolve(true);
                }
            };
            
            this.page.on('console', consoleHandler);
            
            // Clean up handler when done
            setTimeout(() => {
                this.page.off('console', consoleHandler);
            }, this.testTimeout + 1000);
        });
    }

    async testUserInteractions() {
        console.log('🖱️ Testing user interactions...');
        
        try {
            // Test start position selection
            const startPosButton = await this.page.locator('.start-position').first();
            if (await startPosButton.isVisible()) {
                await startPosButton.click();
                await this.delay(1000);
            }
            
            // Test option selection
            const optionButton = await this.page.locator('.option-item').first();
            if (await optionButton.isVisible()) {
                await optionButton.click();
                await this.delay(1000);
            }
            
            // Test adding another beat
            const anotherOption = await this.page.locator('.option-item').nth(1);
            if (await anotherOption.isVisible()) {
                await anotherOption.click();
                await this.delay(1000);
            }
            
        } catch (error) {
            console.log('⚠️ Error during user interaction testing:', error.message);
        }
    }

    handleInfiniteLoopDetected(message) {
        console.log('🚨 INFINITE LOOP DETECTED:', message);
        // This will be handled by the monitoring promise
    }

    async generateReport() {
        console.log('\n📊 GENERATING FINAL REPORT...\n');
        
        const report = {
            timestamp: new Date().toISOString(),
            totalEffectsTested: this.testResults.length,
            passedEffects: this.testResults.filter(r => !r.hasInfiniteLoop).length,
            failedEffects: this.testResults.filter(r => r.hasInfiniteLoop),
            results: this.testResults
        };
        
        // Save report to file
        await fs.writeFile('effect-test-report.json', JSON.stringify(report, null, 2));
        
        // Print summary
        console.log('='.repeat(60));
        console.log('🎯 AUTONOMOUS EFFECT TESTING COMPLETE');
        console.log('='.repeat(60));
        console.log(`📊 Total Effects Tested: ${report.totalEffectsTested}`);
        console.log(`✅ Passed: ${report.passedEffects}`);
        console.log(`❌ Failed: ${report.failedEffects.length}`);
        
        if (report.failedEffects.length > 0) {
            console.log('\n🚨 PROBLEMATIC EFFECTS FOUND:');
            report.failedEffects.forEach((effect, index) => {
                console.log(`${index + 1}. ${effect.name}`);
                console.log(`   📍 Location: ${effect.file}:${effect.lineNumber}`);
                console.log(`   ⏱️ Failed after: ${effect.testDuration}ms`);
                if (effect.errorMessages.length > 0) {
                    console.log(`   💬 Errors: ${effect.errorMessages.join(', ')}`);
                }
                console.log('');
            });
            
            console.log('🔧 RECOMMENDED FIXES:');
            this.generateFixRecommendations(report.failedEffects);
        } else {
            console.log('\n🎉 ALL EFFECTS PASSED! No infinite loops detected.');
        }
        
        console.log('\n📄 Detailed report saved to: effect-test-report.json');
    }

    generateFixRecommendations(failedEffects) {
        failedEffects.forEach((effect, index) => {
            console.log(`\n${index + 1}. FIX FOR: ${effect.name}`);
            
            if (effect.name.includes('beat tracking')) {
                console.log('   🔧 Solution: Use untrack() around state mutations');
                console.log('   📝 Replace: newlyAddedBeatIds = newIds;');
                console.log('   📝 With: untrack(() => { newlyAddedBeatIds = newIds; });');
            } else if (effect.name.includes('loading state')) {
                console.log('   🔧 Solution: Add effect guards and debouncing');
                console.log('   📝 Add: if (isCurrentlyLoading) return;');
            } else if (effect.name.includes('sequence change')) {
                console.log('   🔧 Solution: Use direct callbacks instead of reactive effects');
                console.log('   📝 Replace effect with: onSequenceChange() function call');
            } else {
                console.log('   🔧 Solution: Remove reactive effect, use direct function calls');
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main execution
async function main() {
    const tester = new AutonomousEffectTester();
    
    try {
        await tester.initialize();
        await tester.runTests();
    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await tester.cleanup();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default AutonomousEffectTester;
