/**
 * Initialize development tools and debugging utilities
 */

import { browser } from '$app/environment';
import { initDevToolsUpdater, updateDevTools } from './devToolsUpdater';

/**
 * Initialize all development tools
 */
export function initDevTools() {
  if (!browser) return;

  // Initialize the dev tools updater
  const unsubscribe = initDevToolsUpdater();

  // Set up a global function to manually update the dev tools
  // @ts-ignore - Adding custom property to window
  window.updateDevTools = updateDevTools;

  // Log instructions for using the dev tools
  console.log(`
    [Dev Tools] Development tools initialized
    
    Available global objects:
    - window.sequence: Current sequence state
    - window.appState.sequence: Same as above
    
    Available global functions:
    - window.updateDevTools(): Manually update the dev tools
  `);

  // Return cleanup function
  return unsubscribe;
}
