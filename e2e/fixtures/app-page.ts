import { Page, Locator } from '@playwright/test';

/**
 * Page object for the main application
 * 
 * Encapsulates selectors and actions for the main application layout
 * and navigation between tabs.
 */
export class AppPage {
  readonly page: Page;
  
  // Main layout elements
  readonly mainLayout: Locator;
  readonly menuBar: Locator;
  readonly tabButtons: Record<string, Locator>;
  
  constructor(page: Page) {
    this.page = page;
    
    // Main layout selectors
    this.mainLayout = page.locator('.main-layout-wrapper');
    this.menuBar = page.locator('.menu-bar');
    
    // Tab navigation buttons
    this.tabButtons = {
      write: page.locator('button[data-tab="write"], button:has-text("Write")'),
      generate: page.locator('button[data-tab="generate"], button:has-text("Generate")'),
      construct: page.locator('button[data-tab="construct"], button:has-text("Construct")'),
      browse: page.locator('button[data-tab="browse"], button:has-text("Browse")'),
      learn: page.locator('button[data-tab="learn"], button:has-text("Learn")')
    };
  }
  
  /**
   * Navigate to the application
   */
  async goto() {
    await this.page.goto('/');
    // Wait for the application to be fully loaded
    await this.mainLayout.waitFor({ state: 'visible' });
  }
  
  /**
   * Navigate to a specific tab
   */
  async navigateToTab(tabName: 'write' | 'generate' | 'construct' | 'browse' | 'learn') {
    await this.tabButtons[tabName].click();
    
    // Wait for the tab content to be visible
    const tabContentSelector = `.${tabName}-tab`;
    await this.page.locator(tabContentSelector).waitFor({ state: 'visible' });
  }
  
  /**
   * Check if a specific tab is active
   */
  async isTabActive(tabName: 'write' | 'generate' | 'construct' | 'browse' | 'learn') {
    const activeTabButton = this.tabButtons[tabName];
    return await activeTabButton.evaluate(el => el.classList.contains('active') || el.getAttribute('aria-selected') === 'true');
  }
  
  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen() {
    const fullscreenButton = this.page.locator('button.fullscreen-toggle');
    await fullscreenButton.click();
  }
  
  /**
   * Wait for the application to be fully loaded
   */
  async waitForAppReady() {
    // Wait for the loading overlay to disappear
    await this.page.locator('.loading-overlay-wrapper').waitFor({ state: 'detached', timeout: 10000 });
    
    // Wait for the main layout to be visible
    await this.mainLayout.waitFor({ state: 'visible' });
  }
}
