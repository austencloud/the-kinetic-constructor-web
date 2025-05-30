/**
 * INFINITE LOOP HUNTER - Precise Effect Tracking System
 * This will identify the EXACT effect causing the infinite loops
 */

import { chromium } from 'playwright';

async function huntInfiniteLoops() {
	console.log('🔥 INFINITE LOOP HUNTER - Starting precise effect tracking...');

	const browser = await chromium.launch({
		headless: false,
		devtools: true
	});
	const page = await browser.newPage();

	// Inject effect tracking system into the page
	await page.addInitScript(() => {
		window.effectTracker = {
			effects: [],
			maxEffects: 50,
			loopDetected: false,

			trackEffect: function (effectName, component, data) {
				const timestamp = Date.now();
				const effect = {
					timestamp,
					effectName,
					component,
					data: JSON.stringify(data).substring(0, 200),
					stackTrace: new Error().stack.split('\n').slice(1, 4).join('\n')
				};

				this.effects.push(effect);

				// Keep only recent effects
				if (this.effects.length > this.maxEffects) {
					this.effects.shift();
				}

				// Detect rapid firing (potential loop)
				const recentEffects = this.effects.filter((e) => timestamp - e.timestamp < 100);
				if (recentEffects.length > 10) {
					this.detectLoop(recentEffects);
				}

				console.log(`🔍 EFFECT: [${component}] ${effectName}`, data);
			},

			detectLoop: function (recentEffects) {
				if (this.loopDetected) return;

				// Group by component and effect name
				const groups = {};
				recentEffects.forEach((effect) => {
					const key = `${effect.component}-${effect.effectName}`;
					if (!groups[key]) groups[key] = [];
					groups[key].push(effect);
				});

				// Find groups with many rapid fires
				for (const [key, effects] of Object.entries(groups)) {
					if (effects.length >= 5) {
						this.loopDetected = true;
						console.error('🚨 INFINITE LOOP DETECTED!');
						console.error(`Component: ${effects[0].component}`);
						console.error(`Effect: ${effects[0].effectName}`);
						console.error(`Rapid fires: ${effects.length}`);
						console.error('Recent effects:', effects);
						console.error('Stack trace:', effects[0].stackTrace);

						// Trigger debugger
						debugger;
						break;
					}
				}
			},

			getReport: function () {
				return {
					totalEffects: this.effects.length,
					recentEffects: this.effects.slice(-10),
					loopDetected: this.loopDetected
				};
			}
		};

		// Override console.error to catch Svelte errors
		const originalError = console.error;
		console.error = function (...args) {
			const message = args.join(' ');
			if (message.includes('effect_update_depth_exceeded')) {
				console.log('🚨 SVELTE INFINITE LOOP ERROR CAUGHT!');
				console.log('Effect tracker report:', window.effectTracker.getReport());
				debugger;
			}
			originalError.apply(console, args);
		};
	});

	// Capture all console messages with precise categorization
	const logs = [];
	page.on('console', (msg) => {
		const timestamp = new Date().toISOString();
		const text = msg.text();

		// Detect infinite loop patterns
		if (
			text.includes('effect_update_depth_exceeded') ||
			text.includes('Maximum update depth exceeded')
		) {
			console.log('🚨🚨🚨 INFINITE LOOP ERROR DETECTED! 🚨🚨🚨');
			console.log(`Time: ${timestamp}`);
			console.log(`Message: ${text}`);
		}

		logs.push({ timestamp, text, type: msg.type() });
	});

	try {
		console.log('🌐 Navigating to application...');
		await page.goto('http://localhost:5179', { waitUntil: 'networkidle' });

		console.log('⏳ Waiting for initial load...');
		await page.waitForTimeout(3000);

		// Inject effect tracking into components
		await page.evaluate(() => {
			// Track effects in key components
			if (window.effectTracker) {
				console.log('✅ Effect tracker is ready');
			}
		});

		console.log('🎯 Looking for start position button...');
		const startPositionButton = await page.locator('button:has-text("A")').first();

		if (await startPositionButton.isVisible({ timeout: 5000 })) {
			console.log('✅ Found start position button');

			// Clear logs before click
			logs.length = 0;

			console.log('🖱️ CLICKING START POSITION BUTTON...');
			const clickTime = Date.now();

			await startPositionButton.click();

			console.log('⏰ Waiting for effects to settle...');
			await page.waitForTimeout(2000);

			// Analyze what happened
			console.log('\n📊 POST-CLICK ANALYSIS:');

			const infiniteLoopErrors = logs.filter(
				(log) =>
					log.text.includes('effect_update_depth_exceeded') ||
					log.text.includes('Maximum update depth exceeded')
			);

			console.log(`Infinite loop errors: ${infiniteLoopErrors.length}`);

			if (infiniteLoopErrors.length > 0) {
				console.log('🚨 INFINITE LOOPS DETECTED:');
				infiniteLoopErrors.forEach((error, i) => {
					const timeSinceClick = new Date(error.timestamp).getTime() - clickTime;
					console.log(`  ${i + 1}. +${timeSinceClick}ms: ${error.text}`);
				});
			}

			// Get effect tracker report
			const effectReport = await page.evaluate(() => {
				return window.effectTracker ? window.effectTracker.getReport() : null;
			});

			if (effectReport) {
				console.log('\n🔍 EFFECT TRACKER REPORT:');
				console.log(`Total effects tracked: ${effectReport.totalEffects}`);
				console.log(`Loop detected: ${effectReport.loopDetected}`);
				console.log('Recent effects:', effectReport.recentEffects);
			}

			// Analyze visual rendering
			console.log('\n👁️ VISUAL RENDERING ANALYSIS:');
			const visualState = await page.evaluate(() => {
				const startPosBeat = document.querySelector('.start-pos-beat');
				if (!startPosBeat) return { error: 'StartPosBeat not found' };

				return {
					exists: true,
					innerHTML: startPosBeat.innerHTML,
					childElements: Array.from(startPosBeat.children).map((child) => ({
						tagName: child.tagName,
						className: child.className,
						textContent: child.textContent?.substring(0, 50),
						hasChildren: child.children.length > 0,
						childCount: child.children.length
					})),
					glyphs: {
						count: startPosBeat.querySelectorAll('.tka-glyph').length,
						elements: Array.from(startPosBeat.querySelectorAll('.tka-glyph')).map((glyph) => ({
							className: glyph.className,
							innerHTML: glyph.innerHTML.substring(0, 100),
							visible: glyph.offsetWidth > 0 && glyph.offsetHeight > 0,
							offsetWidth: glyph.offsetWidth,
							offsetHeight: glyph.offsetHeight,
							style: glyph.getAttribute('style'),
							transform: glyph.getAttribute('transform'),
							letterImages: Array.from(glyph.querySelectorAll('.tka-letter image')).map((img) => ({
								href: img.getAttribute('href'),
								width: img.getAttribute('width'),
								height: img.getAttribute('height'),
								loaded: img.complete,
								naturalWidth: img.naturalWidth,
								naturalHeight: img.naturalHeight,
								offsetWidth: img.offsetWidth,
								offsetHeight: img.offsetHeight,
								computedStyle: window.getComputedStyle(img).display
							})),
							parentSVG: {
								offsetWidth: glyph.closest('svg')?.offsetWidth || 0,
								offsetHeight: glyph.closest('svg')?.offsetHeight || 0,
								viewBox: glyph.closest('svg')?.getAttribute('viewBox')
							}
						}))
					},
					props: {
						count: startPosBeat.querySelectorAll('.prop').length,
						elements: Array.from(startPosBeat.querySelectorAll('.prop')).map((prop) => ({
							className: prop.className,
							visible: prop.offsetWidth > 0 && prop.offsetHeight > 0
						}))
					},
					arrows: {
						count: startPosBeat.querySelectorAll('.arrow').length,
						elements: Array.from(startPosBeat.querySelectorAll('.arrow')).map((arrow) => ({
							className: arrow.className,
							visible: arrow.offsetWidth > 0 && arrow.offsetHeight > 0
						}))
					},
					svgElements: startPosBeat.querySelectorAll('svg').length,
					imageElements: startPosBeat.querySelectorAll('image').length
				};
			});

			console.log('Visual state:', JSON.stringify(visualState, null, 2));

			// Check if elements are actually visible
			if (visualState.glyphs && visualState.glyphs.count > 0) {
				console.log('\n🔍 GLYPH VISIBILITY ANALYSIS:');
				visualState.glyphs.elements.forEach((glyph, i) => {
					console.log(`  Glyph ${i + 1}: visible=${glyph.visible}, content="${glyph.innerHTML}"`);
				});
			}

			// Wait longer to see if more loops occur
			console.log('\n⏰ Monitoring for additional loops...');
			await page.waitForTimeout(5000);

			const additionalErrors = logs.filter(
				(log) =>
					new Date(log.timestamp).getTime() > clickTime + 2000 &&
					(log.text.includes('effect_update_depth_exceeded') ||
						log.text.includes('Maximum update depth exceeded'))
			);

			if (additionalErrors.length > 0) {
				console.log(`🚨 ${additionalErrors.length} additional infinite loop errors detected!`);
			}
		} else {
			console.log('❌ Start position button not found');
		}

		console.log('\n🔍 Browser will remain open for manual inspection...');
		console.log('Press Ctrl+C to close when done.');

		// Keep browser open for manual inspection
		await new Promise(() => {});
	} catch (error) {
		console.error('❌ Debug session failed:', error);
	}
}

// Run the infinite loop hunter
huntInfiniteLoops().catch(console.error);
