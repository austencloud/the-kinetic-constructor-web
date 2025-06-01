# ✨ Magical F5 Development Experience Setup Guide

## Overview

Transform your development workflow with an enchanted F5 experience that provides lightning-fast startup, beautiful visual feedback, and intelligent automation. This guide standardizes the magical development experience across all codebases.

## Core Features

- **Lightning-fast startup** with intelligent caching and dependency management
- **Beautiful visual feedback** with animated progress indicators and console styling
- **Smart browser integration** with auto-opening dev tools and enhanced reload animations
- **Performance monitoring** with real-time metrics and health checks
- **Enhanced hot reloading** with visual feedback and auto-recovery
- **Multiple trigger methods** (F5 key, npm scripts, VS Code tasks)

## Installation Steps

### 1. Core Magical Script

Create `scripts/magical-dev.js`:

```javascript
#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

const magic = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	cyan: '\x1b[36m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	red: '\x1b[31m',

	rainbow: (text) => {
		const colors = [magic.red, magic.yellow, magic.green, magic.cyan, magic.blue, magic.magenta];
		return (
			text
				.split('')
				.map((char, i) => colors[i % colors.length] + char)
				.join('') + magic.reset
		);
	},

	box: (text, color = magic.cyan) => {
		const lines = text.split('\n');
		const maxLength = Math.max(...lines.map((line) => line.length));
		const border = '─'.repeat(maxLength + 2);

		return [
			color + '┌' + border + '┐' + magic.reset,
			...lines.map((line) => color + '│ ' + line.padEnd(maxLength) + ' │' + magic.reset),
			color + '└' + border + '┘' + magic.reset
		].join('\n');
	}
};

class MagicalSpinner {
	constructor(message = 'Loading...', frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']) {
		this.message = message;
		this.frames = frames;
		this.current = 0;
		this.interval = null;
	}

	start() {
		process.stdout.write('\x1B[?25l');
		this.interval = setInterval(() => {
			process.stdout.write(
				`\r${magic.cyan}${this.frames[this.current]}${magic.reset} ${this.message}`
			);
			this.current = (this.current + 1) % this.frames.length;
		}, 100);
	}

	stop(successMessage = '') {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		process.stdout.write('\r\x1B[K');
		process.stdout.write('\x1B[?25h');
		if (successMessage) {
			console.log(`${magic.green}✓${magic.reset} ${successMessage}`);
		}
	}

	update(message) {
		this.message = message;
	}
}

class DependencyMagic {
	static async checkAndInstall() {
		const spinner = new MagicalSpinner('Checking dependencies...');
		spinner.start();

		try {
			const nodeModulesPath = path.join(process.cwd(), 'node_modules');
			const packageJsonPath = path.join(process.cwd(), 'package.json');

			if (!existsSync(nodeModulesPath)) {
				spinner.update('Installing dependencies for the first time...');
				await execAsync('npm install');
				spinner.stop('Dependencies installed successfully!');
				return;
			}

			const [nodeModulesStat, packageJsonStat] = await Promise.all([
				fs.stat(nodeModulesPath),
				fs.stat(packageJsonPath)
			]);

			if (packageJsonStat.mtime > nodeModulesStat.mtime) {
				spinner.update('Package.json changed, updating dependencies...');
				await execAsync('npm install');
				spinner.stop('Dependencies updated!');
			} else {
				spinner.stop('Dependencies are up to date!');
			}
		} catch (error) {
			spinner.stop();
			console.log(`${magic.yellow}⚠${magic.reset} Dependency check failed, continuing anyway...`);
		}
	}
}

class CacheMagic {
	static async optimize() {
		const spinner = new MagicalSpinner('Optimizing caches...');
		spinner.start();

		try {
			const viteCachePath = path.join(process.cwd(), 'node_modules', '.vite');
			if (existsSync(viteCachePath)) {
				const stat = await fs.stat(viteCachePath);
				const daysSinceModified = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);

				if (daysSinceModified > 7) {
					spinner.update('Clearing old Vite cache...');
					await fs.rm(viteCachePath, { recursive: true, force: true });
				}
			}

			spinner.stop('Cache optimized!');
		} catch (error) {
			spinner.stop('Cache optimization skipped');
		}
	}
}

class PortMagic {
	static async findMagicalPort(startPort = 7734) {
		const net = await import('net');

		function checkPort(port) {
			return new Promise((resolve) => {
				const server = net.default.createServer();
				server.once('error', () => resolve(false));
				server.once('listening', () => {
					server.close();
					resolve(true);
				});
				server.listen(port);
			});
		}

		if (await checkPort(startPort)) {
			return startPort;
		}

		for (let port = startPort + 1; port < startPort + 10; port++) {
			if (await checkPort(port)) {
				return port;
			}
		}

		return startPort;
	}
}

class BrowserMagic {
	static async launchWithDevTools(url) {
		const isWindows = process.platform === 'win32';
		const isMac = process.platform === 'darwin';

		try {
			if (isWindows) {
				const commands = [
					`start chrome "${url}" --auto-open-devtools-for-tabs`,
					`start msedge "${url}" --auto-open-devtools-for-tabs`,
					`start "${url}"`
				];

				for (const cmd of commands) {
					try {
						await execAsync(cmd);
						break;
					} catch (e) {
						continue;
					}
				}
			} else if (isMac) {
				await execAsync(`open -a "Google Chrome" "${url}" --args --auto-open-devtools-for-tabs`);
			} else {
				await execAsync(`google-chrome "${url}" --auto-open-devtools-for-tabs || firefox "${url}"`);
			}
		} catch (error) {
			console.log(`${magic.yellow}⚠${magic.reset} Could not auto-open browser with dev tools`);
		}
	}
}

async function startMagicalDevelopment() {
	console.clear();
	console.log(magic.box(magic.rainbow('✨ MAGICAL DEVELOPMENT EXPERIENCE ✨'), magic.cyan));
	console.log('');

	try {
		console.log(`${magic.blue}🔮 Phase 1: Environment Magic${magic.reset}`);
		await DependencyMagic.checkAndInstall();
		await CacheMagic.optimize();

		console.log(`\n${magic.blue}🔮 Phase 2: Port Magic${magic.reset}`);
		const port = await PortMagic.findMagicalPort();
		console.log(
			`${magic.green}✓${magic.reset} Found magical port: ${magic.cyan}${port}${magic.reset}`
		);

		console.log(`\n${magic.blue}🔮 Phase 3: Server Summoning${magic.reset}`);
		const startTime = Date.now();

		const args = ['dev', '--port', port.toString(), '--logLevel=error'];
		if (process.argv.includes('--open') || process.argv.includes('--browser')) {
			args.push('--open');
		}

		const vite = spawn('vite', args, {
			stdio: ['inherit', 'pipe', 'pipe'],
			shell: true,
			env: { ...process.env, FORCE_COLOR: '1' }
		});

		let serverReady = false;

		vite.stdout.on('data', async (data) => {
			const output = data.toString();

			if ((output.includes('ready') || output.includes('Local:')) && !serverReady) {
				serverReady = true;
				const startupTime = ((Date.now() - startTime) / 1000).toFixed(2);

				console.log(
					'\n' +
						magic.box(
							`
🚀 Server Ready in ${startupTime}s!

${magic.bright}Local:${magic.reset}   ${magic.cyan}http://localhost:${port}/${magic.reset}
${magic.bright}Network:${magic.reset} ${magic.dim}Use --host to expose${magic.reset}

${magic.green}✨ Happy coding! Press Ctrl+C to stop${magic.reset}
        `.trim(),
							magic.green
						)
				);

				if (process.argv.includes('--open') || process.argv.includes('--browser')) {
					console.log(`\n${magic.yellow}🌐 Opening browser with dev tools...${magic.reset}`);
					await BrowserMagic.launchWithDevTools(`http://localhost:${port}`);
				}

				process.on('SIGINT', () => {
					console.log(
						`\n\n${magic.magenta}✨ Thanks for using the magical dev experience!${magic.reset}`
					);
					vite.kill('SIGINT');
					process.exit(0);
				});
			}

			if (output.includes('ERROR') || output.includes('error')) {
				console.log(`\n${magic.red}💥 ${output.trim()}${magic.reset}`);
			}
		});

		vite.stderr.on('data', (data) => {
			const error = data.toString();
			if (!error.includes('ExperimentalWarning')) {
				console.log(`${magic.red}🚨 ${error.trim()}${magic.reset}`);
			}
		});

		vite.on('close', (code) => {
			if (code !== 0) {
				console.log(`\n${magic.red}💔 Server stopped with code ${code}${magic.reset}`);
			}
		});

		setTimeout(() => {
			if (!serverReady) {
				console.log(
					`\n${magic.dim}💡 Tip: Add --browser to auto-open with dev tools${magic.reset}`
				);
				console.log(`${magic.dim}💡 Tip: Press F5 in browser for instant reload${magic.reset}`);
			}
		}, 2000);
	} catch (error) {
		console.error(`\n${magic.red}💥 Magical startup failed:${magic.reset}`, error.message);
		process.exit(1);
	}
}

startMagicalDevelopment().catch((error) => {
	console.error(`${magic.red}💥 Critical magical failure:${magic.reset}`, error);
	process.exit(1);
});
```

### 2. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
	"scripts": {
		"magic": "node scripts/magical-dev.js",
		"magic:browser": "node scripts/magical-dev.js --browser",
		"magic:clean": "npm run clean && node scripts/magical-dev.js",
		"magic:reset": "npm run clean:deep && node scripts/magical-dev.js --browser",
		"f5": "npm run magic:browser"
	}
}
```

### 3. Enhanced Browser Experience

Update your main HTML file (e.g., `src/app.html`, `index.html`, or `public/index.html`):

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />

		<script>
			(function() {
			  'use strict';

			  function createMagicalLoader() {
			    const loader = document.createElement('div');
			    loader.id = 'magical-loader';
			    loader.innerHTML = `
			      <style>
			        #magical-loader {
			          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
			          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			          z-index: 10000; display: flex; flex-direction: column;
			          justify-content: center; align-items: center; color: white;
			          font-family: system-ui, -apple-system, sans-serif;
			          opacity: 0; transition: opacity 0.3s ease;
			        }
			        .magical-spinner {
			          width: 60px; height: 60px;
			          border: 4px solid rgba(255,255,255,0.3);
			          border-top: 4px solid white; border-radius: 50%;
			          animation: magical-spin 1s linear infinite;
			        }
			        .magical-text {
			          margin-top: 20px; font-size: 18px; font-weight: 500;
			          animation: magical-pulse 2s ease-in-out infinite;
			        }
			        .magical-progress {
			          width: 200px; height: 4px;
			          background: rgba(255,255,255,0.3); border-radius: 2px;
			          margin-top: 20px; overflow: hidden;
			        }
			        .magical-progress-bar {
			          width: 0%; height: 100%;
			          background: linear-gradient(90deg, #00f5ff, #ff00ff, #00f5ff);
			          background-size: 200% 100%;
			          animation: magical-progress 2s ease-out, magical-rainbow 1s linear infinite;
			        }
			        @keyframes magical-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
			        @keyframes magical-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
			        @keyframes magical-progress { 0% { width: 0%; } 100% { width: 100%; } }
			        @keyframes magical-rainbow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
			      </style>
			      <div class="magical-spinner"></div>
			      <div class="magical-text">✨ Reloading with magic...</div>
			      <div class="magical-progress"><div class="magical-progress-bar"></div></div>
			    `;
			    return loader;
			  }

			  let isReloading = false;

			  function handleMagicalReload(event) {
			    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
			      if (isReloading) return;
			      isReloading = true;
			      event.preventDefault();

			      const loader = createMagicalLoader();
			      document.body.appendChild(loader);

			      requestAnimationFrame(() => {
			        loader.style.opacity = '1';
			      });

			      setTimeout(() => {
			        window.location.reload();
			      }, 500);
			    }
			  }

			  function logPerformanceMetrics() {
			    if (window.performance && console.groupCollapsed) {
			      const navigation = performance.getEntriesByType('navigation')[0];
			      if (navigation) {
			        console.groupCollapsed('✨ Magical Performance Metrics');
			        console.log(`🚀 Total Load Time: ${Math.round(navigation.loadEventEnd - navigation.fetchStart)}ms`);
			        console.log(`🎯 DOM Ready: ${Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)}ms`);
			        console.log(`💨 First Paint: ${Math.round(navigation.responseEnd - navigation.fetchStart)}ms`);

			        if (performance.memory) {
			          console.log(`🧠 Memory Used: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`);
			        }
			        console.groupEnd();
			      }
			    }
			  }

			  function showDeveloperWelcome() {
			    const styles = [
			      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			      'color: white', 'padding: 10px 20px', 'border-radius: 8px',
			      'font-size: 14px', 'font-weight: bold'
			    ].join(';');

			    console.log('%c✨ Magical Development Mode Active!', styles);
			    console.log('🎯 Press F5 for enhanced reload experience');
			    console.log('🔥 Hot Module Replacement is active');
			    console.log('💡 Open DevTools for more magic');
			  }

			  document.addEventListener('DOMContentLoaded', function() {
			    document.addEventListener('keydown', handleMagicalReload);

			    if (typeof __MAGICAL_DEV__ !== 'undefined' && __MAGICAL_DEV__) {
			      setTimeout(logPerformanceMetrics, 1000);
			      showDeveloperWelcome();
			    }
			  });

			  if (import.meta && import.meta.hot) {
			    import.meta.hot.on('vite:beforeUpdate', () => {
			      console.log('🔥 Hot reloading...');
			    });

			    import.meta.hot.on('vite:afterUpdate', () => {
			      console.log('✅ Hot reload complete!');
			    });
			  }
			})();
		</script>
	</head>
	<body>
		<!-- Your app content -->
	</body>
</html>
```

### 4. VS Code Integration

Create `.vscode/tasks.json`:

```json
{
	"version": "2.0.0",
	"tasks": [
		{
			"label": "✨ Magical F5 Start",
			"type": "shell",
			"command": "npm run f5",
			"group": {
				"kind": "build",
				"isDefault": true
			},
			"presentation": {
				"echo": true,
				"reveal": "always",
				"focus": false,
				"panel": "new",
				"showReuseMessage": false,
				"clear": true
			},
			"problemMatcher": [],
			"options": {
				"env": {
					"FORCE_COLOR": "1"
				}
			}
		},
		{
			"label": "🧹 Magic Clean Start",
			"type": "shell",
			"command": "npm run magic:clean",
			"group": "build"
		},
		{
			"label": "🔄 Magic Reset Start",
			"type": "shell",
			"command": "npm run magic:reset",
			"group": "build"
		}
	]
}
```

Create `.vscode/keybindings.json`:

```json
[
	{
		"key": "f5",
		"command": "workbench.action.tasks.runTask",
		"args": "✨ Magical F5 Start",
		"when": "!inDebugMode"
	},
	{
		"key": "ctrl+f5",
		"command": "workbench.action.tasks.runTask",
		"args": "🔄 Magic Reset Start"
	},
	{
		"key": "shift+f5",
		"command": "workbench.action.tasks.runTask",
		"args": "🧹 Magic Clean Start"
	}
]
```

### 5. Enhanced Vite Configuration (Optional)

For Vite projects, enhance `vite.config.js/ts`:

```javascript
export default defineConfig({
	// ...existing config...

	define: {
		__DEV_MODE__: JSON.stringify(process.env.NODE_ENV === 'development'),
		__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		__MAGICAL_DEV__: JSON.stringify(true)
	},

	server: {
		hmr: {
			timeout: 120000,
			overlay: true
		},
		watch: {
			usePolling: false,
			interval: 100,
			ignored: [
				'**/node_modules/**',
				'**/.git/**',
				'**/dist/**',
				'**/build/**',
				'**/.vscode/**',
				'**/*.log'
			]
		},
		warmup: {
			clientFiles: ['./src/**/*.{js,ts,jsx,tsx,vue,svelte}', './src/**/*.html']
		}
	}
});
```

## Usage

### Primary Commands

- `npm run f5` - Main magical experience with browser auto-open
- `npm run magic` - Basic magical start without browser
- `npm run magic:clean` - Clean start with cache clearing
- `npm run magic:reset` - Full reset with deep cache clearing

### Keyboard Shortcuts

- `F5` in VS Code - Launches magical development experience
- `Ctrl+F5` in VS Code - Magic reset start
- `Shift+F5` in VS Code - Magic clean start
- `F5` in browser - Enhanced reload with animations

## Framework Adaptations

### React/Next.js

Replace `vite` commands with `next dev` or your React development server command.

### Vue/Nuxt

Replace `vite` commands with `nuxt dev` or Vue CLI commands.

### Angular

Replace `vite` commands with `ng serve`.

### Express/Node.js

Replace `vite` commands with `nodemon` or your Node.js start command.

### Static Sites

Use your static site generator's development command (e.g., `hugo server`, `jekyll serve`).

## Customization

### Colors and Styling

Modify the `magic` object in `magical-dev.js` to change colors and visual styling.

### Startup Phases

Add or modify phases in the `startMagicalDevelopment()` function.

### Browser Integration

Customize the `BrowserMagic.launchWithDevTools()` method for different browser preferences.

### Performance Monitoring

Extend the `logPerformanceMetrics()` function to track additional metrics.

## Troubleshooting

### Common Issues

**Script not found errors:**

- Ensure `scripts/` directory exists
- Verify file permissions (run `chmod +x scripts/magical-dev.js` on Unix systems)

**Port conflicts:**

- The script automatically finds available ports starting from the default
- Manually specify a port range in `PortMagic.findMagicalPort()`

**Browser not opening:**

- Check browser installation paths in `BrowserMagic.launchWithDevTools()`
- Fallback commands are provided for different browsers

**VS Code keybindings not working:**

- Reload VS Code window after adding keybindings
- Check for conflicting keybindings in VS Code settings

### Performance Optimization

- Adjust file watching intervals in your build tool configuration
- Customize ignored patterns for your project structure
- Modify cache clearing logic based on your dependency patterns

## Benefits

- **Reduced cognitive load** - One command starts everything
- **Faster feedback loops** - Visual progress indicators and instant browser opening
- **Better developer experience** - Beautiful animations and helpful logging
- **Consistent workflow** - Same experience across all projects
- **Performance insights** - Built-in metrics and monitoring

---

_Copy this guide to each codebase and adapt the framework-specific commands for a consistent magical development experience everywhere!_ ✨
