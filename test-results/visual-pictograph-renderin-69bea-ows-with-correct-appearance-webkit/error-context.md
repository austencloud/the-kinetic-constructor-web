# Test info

- Name: Pictograph Visual Rendering >> should render arrows with correct appearance
- Location: C:\the-kinetic-constructor-web\e2e\visual\pictograph-rendering.visual.spec.ts:329:2

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\auste\AppData\Local\ms-playwright\webkit-2158\Playwright.exe
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
  229 | 		await page.waitForTimeout(2000);
  230 |
  231 | 		// Take a screenshot before adding prop
  232 | 		await page.screenshot({ path: 'test-results/before-add-prop.png' });
  233 |
  234 | 		// Try to find and click the add prop button using JavaScript
  235 | 		await page.evaluate(() => {
  236 | 			// Try multiple ways to find the add prop button
  237 | 			const possibleButtons = [
  238 | 				// By text content
  239 | 				...Array.from(document.querySelectorAll('button')).filter((b) =>
  240 | 					b.textContent?.toLowerCase().includes('add prop')
  241 | 				),
  242 | 				// By data attribute
  243 | 				document.querySelector('[data-test="add-prop-button"]'),
  244 | 				// By class
  245 | 				document.querySelector('.add-prop-button')
  246 | 			].filter(Boolean);
  247 |
  248 | 			if (possibleButtons.length > 0) {
  249 | 				(possibleButtons[0] as HTMLElement).click();
  250 |
  251 | 				// Wait a moment for the prop menu to appear
  252 | 				setTimeout(() => {
  253 | 					// Try to find and click the club prop option
  254 | 					const clubOptions = [
  255 | 						// By text content
  256 | 						...Array.from(document.querySelectorAll('button, div')).filter((b) =>
  257 | 							b.textContent?.toLowerCase().includes('club')
  258 | 						),
  259 | 						// By data attribute
  260 | 						document.querySelector('[data-prop-type="club"]')
  261 | 					].filter(Boolean);
  262 |
  263 | 					if (clubOptions.length > 0) {
  264 | 						(clubOptions[0] as HTMLElement).click();
  265 |
  266 | 						// Wait a moment for the prop to be selected
  267 | 						setTimeout(() => {
  268 | 							// Try to find and click the center point
  269 | 							const centerPoints = [
  270 | 								document.querySelector('.center-point'),
  271 | 								document.querySelector('[data-point-name="center"]')
  272 | 							].filter(Boolean);
  273 |
  274 | 							if (centerPoints.length > 0) {
  275 | 								(centerPoints[0] as HTMLElement).click();
  276 | 								return true;
  277 | 							}
  278 | 						}, 500);
  279 | 					}
  280 | 				}, 500);
  281 |
  282 | 				return true;
  283 | 			}
  284 |
  285 | 			return false;
  286 | 		});
  287 |
  288 | 		// Wait for the prop to be added
  289 | 		await page.waitForTimeout(2000);
  290 |
  291 | 		// Take a screenshot after adding prop
  292 | 		await page.screenshot({ path: 'test-results/after-add-prop.png' });
  293 |
  294 | 		// Try to find the prop component using JavaScript
  295 | 		const propInfo = await page.evaluate(() => {
  296 | 			// Try multiple selectors to find the prop
  297 | 			const selectors = [
  298 | 				'.prop-component',
  299 | 				'[data-test="prop"]',
  300 | 				'.tka-dot',
  301 | 				'.pictograph-wrapper .prop'
  302 | 			];
  303 |
  304 | 			for (const selector of selectors) {
  305 | 				const elements = document.querySelectorAll(selector);
  306 | 				if (elements.length > 0) {
  307 | 					return {
  308 | 						selector,
  309 | 						count: elements.length,
  310 | 						found: true
  311 | 					};
  312 | 				}
  313 | 			}
  314 |
  315 | 			return { found: false };
  316 | 		});
  317 |
  318 | 		// Use the selector that was found
  319 | 		let propSelector = '.prop-component, [data-test="prop"]';
  320 | 		if (propInfo.found && propInfo.selector) {
  321 | 			propSelector = propInfo.selector;
  322 | 		}
  323 |
  324 | 		// Take a screenshot of the prop
  325 | 		const propElement = page.locator(propSelector);
  326 | 		await VisualTestingUtils.takeComponentScreenshot(page, propElement, 'club-prop');
  327 | 	});
  328 |
> 329 | 	test('should render arrows with correct appearance', async ({ page }) => {
      | 	^ Error: browserType.launch: Executable doesn't exist at C:\Users\auste\AppData\Local\ms-playwright\webkit-2158\Playwright.exe
  330 | 		// Wait for the pictograph to load
  331 | 		await page.waitForTimeout(2000);
  332 |
  333 | 		// Take a screenshot before adding motion
  334 | 		await page.screenshot({ path: 'test-results/before-add-motion.png' });
  335 |
  336 | 		// Try to find and click the add motion button using JavaScript
  337 | 		await page.evaluate(() => {
  338 | 			// Try multiple ways to find the add motion button
  339 | 			const possibleButtons = [
  340 | 				// By text content
  341 | 				...Array.from(document.querySelectorAll('button')).filter((b) =>
  342 | 					b.textContent?.toLowerCase().includes('add motion')
  343 | 				),
  344 | 				// By data attribute
  345 | 				document.querySelector('[data-test="add-motion-button"]'),
  346 | 				// By class
  347 | 				document.querySelector('.add-motion-button')
  348 | 			].filter(Boolean);
  349 |
  350 | 			if (possibleButtons.length > 0) {
  351 | 				(possibleButtons[0] as HTMLElement).click();
  352 |
  353 | 				// Wait a moment for the motion menu to appear
  354 | 				setTimeout(() => {
  355 | 					// Try to find and click the pro motion option
  356 | 					const proOptions = [
  357 | 						// By text content
  358 | 						...Array.from(document.querySelectorAll('button, div')).filter((b) =>
  359 | 							b.textContent?.toLowerCase().includes('pro')
  360 | 						),
  361 | 						// By data attribute
  362 | 						document.querySelector('[data-motion-type="pro"]')
  363 | 					].filter(Boolean);
  364 |
  365 | 					if (proOptions.length > 0) {
  366 | 						(proOptions[0] as HTMLElement).click();
  367 |
  368 | 						// Wait a moment for the motion to be selected
  369 | 						setTimeout(() => {
  370 | 							// Try to find and click the NE point
  371 | 							const nePoints = [
  372 | 								document.querySelector('.ne-point'),
  373 | 								document.querySelector('[data-point-name="ne"]')
  374 | 							].filter(Boolean);
  375 |
  376 | 							if (nePoints.length > 0) {
  377 | 								(nePoints[0] as HTMLElement).click();
  378 |
  379 | 								// Wait a moment for the start point to be selected
  380 | 								setTimeout(() => {
  381 | 									// Try to find and click the SW point
  382 | 									const swPoints = [
  383 | 										document.querySelector('.sw-point'),
  384 | 										document.querySelector('[data-point-name="sw"]')
  385 | 									].filter(Boolean);
  386 |
  387 | 									if (swPoints.length > 0) {
  388 | 										(swPoints[0] as HTMLElement).click();
  389 | 										return true;
  390 | 									}
  391 | 								}, 500);
  392 | 							}
  393 | 						}, 500);
  394 | 					}
  395 | 				}, 500);
  396 |
  397 | 				return true;
  398 | 			}
  399 |
  400 | 			return false;
  401 | 		});
  402 |
  403 | 		// Wait for the motion to be added
  404 | 		await page.waitForTimeout(3000);
  405 |
  406 | 		// Take a screenshot after adding motion
  407 | 		await page.screenshot({ path: 'test-results/after-add-motion.png' });
  408 |
  409 | 		// Try to find the arrow component using JavaScript
  410 | 		const arrowInfo = await page.evaluate(() => {
  411 | 			// Try multiple selectors to find the arrow
  412 | 			const selectors = [
  413 | 				'.arrow-component',
  414 | 				'[data-test="arrow"]',
  415 | 				'.tka-dash',
  416 | 				'.pictograph-wrapper .arrow'
  417 | 			];
  418 |
  419 | 			for (const selector of selectors) {
  420 | 				const elements = document.querySelectorAll(selector);
  421 | 				if (elements.length > 0) {
  422 | 					return {
  423 | 						selector,
  424 | 						count: elements.length,
  425 | 						found: true
  426 | 					};
  427 | 				}
  428 | 			}
  429 |
```
