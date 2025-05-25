# Test info

- Name: Pictograph Visual Rendering >> should render props with correct appearance
- Location: C:\the-kinetic-constructor-web\e2e\visual\pictograph-rendering.visual.spec.ts:227:2

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\auste\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
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
  127 |
  128 | 		// Try to find and click the box grid button using JavaScript
  129 | 		const clicked = await page.evaluate(() => {
  130 | 			// Try multiple ways to find the box grid button
  131 | 			const possibleButtons = [
  132 | 				// By text content
  133 | 				...Array.from(document.querySelectorAll('button')).filter((b) =>
  134 | 					b.textContent?.toLowerCase().includes('box grid')
  135 | 				),
  136 | 				// By data attribute
  137 | 				document.querySelector('[data-test="box-grid-button"]'),
  138 | 				// By class
  139 | 				document.querySelector('.box-grid-button'),
  140 | 				// By any grid toggle button
  141 | 				document.querySelector('.grid-toggle button')
  142 | 			].filter(Boolean);
  143 |
  144 | 			if (possibleButtons.length > 0) {
  145 | 				(possibleButtons[0] as HTMLElement).click();
  146 | 				return true;
  147 | 			}
  148 |
  149 | 			return false;
  150 | 		});
  151 |
  152 | 		if (!clicked) {
  153 | 			console.log('Could not find box grid button using JavaScript, trying Playwright locator');
  154 |
  155 | 			// Try multiple selectors
  156 | 			const selectors = [
  157 | 				'button:has-text("Box Grid")',
  158 | 				'[data-test="box-grid-button"]',
  159 | 				'.box-grid-button',
  160 | 				'.grid-toggle button'
  161 | 			];
  162 |
  163 | 			for (const selector of selectors) {
  164 | 				try {
  165 | 					const count = await page.locator(selector).count();
  166 | 					if (count > 0) {
  167 | 						await page.locator(selector).first().click();
  168 | 						console.log(`Clicked box grid button using selector: ${selector}`);
  169 | 						break;
  170 | 					}
  171 | 				} catch (e) {
  172 | 					console.log(`Error clicking with selector ${selector}:`, e);
  173 | 				}
  174 | 			}
  175 | 		}
  176 |
  177 | 		// Wait for the grid to update
  178 | 		await page.waitForTimeout(1000);
  179 |
  180 | 		// Take a screenshot after switching grid mode
  181 | 		await page.screenshot({ path: 'test-results/after-box-grid.png' });
  182 |
  183 | 		// Try to find the grid component using JavaScript
  184 | 		const gridInfo = await page.evaluate(() => {
  185 | 			// Try multiple selectors to find the grid
  186 | 			const selectors = [
  187 | 				'.grid-component',
  188 | 				'.tka-grid',
  189 | 				'.grid-svg',
  190 | 				'.pictograph-wrapper svg',
  191 | 				'.pictograph svg'
  192 | 			];
  193 |
  194 | 			for (const selector of selectors) {
  195 | 				const elements = document.querySelectorAll(selector);
  196 | 				if (elements.length > 0) {
  197 | 					return {
  198 | 						selector,
  199 | 						count: elements.length,
  200 | 						found: true
  201 | 					};
  202 | 				}
  203 | 			}
  204 |
  205 | 			return { found: false };
  206 | 		});
  207 |
  208 | 		// Use the selector that was found
  209 | 		let gridSelector = '.grid-component';
  210 | 		if (gridInfo.found && gridInfo.selector) {
  211 | 			gridSelector = gridInfo.selector;
  212 | 		}
  213 |
  214 | 		// Take a screenshot of the box grid
  215 | 		const gridElement = page.locator(gridSelector);
  216 | 		await VisualTestingUtils.takeComponentScreenshot(page, gridElement, 'box-grid');
  217 |
  218 | 		// Verify the grid mode has changed
  219 | 		try {
  220 | 			const gridMode = await pictographPage.getGridMode();
  221 | 			console.log(`Current grid mode: ${gridMode}`);
  222 | 		} catch (e) {
  223 | 			console.log('Error getting grid mode:', e);
  224 | 		}
  225 | 	});
  226 |
> 227 | 	test('should render props with correct appearance', async ({ page }) => {
      | 	^ Error: browserType.launch: Executable doesn't exist at C:\Users\auste\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
  228 | 		// Wait for the pictograph to load
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
```
